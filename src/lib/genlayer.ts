import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

export const getContractAddress = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('DAO_CONTRACT_ADDRESS_V9');
    if (stored && stored.length === 42 && stored.startsWith('0x')) return stored;
    if (stored) localStorage.removeItem('DAO_CONTRACT_ADDRESS_V9');
  }
  return "0x0000000000000000000000000000000000000000";
};

export const setContractAddress = (address: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('DAO_CONTRACT_ADDRESS_V9', address);
        window.location.reload(); // Reload to pick up new state
    }
};

const SNAP_PROBE_METHODS = new Set([
  "wallet_getSnaps",
  "wallet_requestSnaps",
  "wallet_invokeSnap",
  "wallet_snap",
]);

function hardenProvider(provider: any): any {
  if (!provider || typeof provider.request !== "function") return provider;
  const originalRequest = provider.request.bind(provider);
  return new Proxy(provider, {
    get(target, prop, receiver) {
      if (prop === "request") {
        return async (args: any) => {
          if (args && SNAP_PROBE_METHODS.has(args.method)) return {};
          return originalRequest(args);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

let _client: any = null;

export const getGenLayerClient = () => {
    if (_client) return _client;
    _client = createClient({
      chain: studionet,
      // @ts-ignore
      provider: typeof window !== 'undefined' ? hardenProvider(window.ethereum) : undefined,
    });
    return _client;
};

// --- RPC Queueing ---
const MIN_GAP_MS = 350;
const MAX_RETRIES = 4;
let queue = Promise.resolve();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    let attempt = 0;
    while (true) {
      try {
        return await task();
      } catch (e: any) {
        if ((e.message?.includes('429') || e.message?.includes('Too Many Requests') || e.status === 429) && attempt < MAX_RETRIES) {
          await sleep(800 * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        throw e;
      } finally {
        await sleep(MIN_GAP_MS);
      }
    }
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function waitForGenLayerTransaction(res: any) {
    const txHash = typeof res === 'string' ? res : (res as any).hash || res;
    if (!txHash) throw new Error("No transaction hash returned");
      
    return await getGenLayerClient().waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      status: 'ACCEPTED',
      interval: 5000,
      retries: 120
    });
}

/**
 * Service to interact directly with our DAO Intelligent Contract 
 * on GenLayer using the genlayer-js SDK.
 */
export const GenLayerService = {
  getProposals: async () => {
    try {
      const address = getContractAddress();
      if (address === "0x0000000000000000000000000000000000000000") {
        return [];
      }
      
      const snapshotRes = await schedule(() => getGenLayerClient().readContract({
        address: address as `0x${string}`,
        functionName: 'export_state_snapshot',
        args: [0, 50] // offset, limit
      }));
      
      const snapshot = JSON.parse(snapshotRes as string);
      if (!snapshot.data || snapshot.data.length === 0) return [];
      
      const proposals = [];
      for (const p of snapshot.data) {
        const detailRes = await schedule(() => getGenLayerClient().readContract({
          address: address as `0x${string}`,
          functionName: 'get_proposal',
          args: [p.id]
        }));
        const details = JSON.parse(detailRes as string);
        
        let reqFunds = 0;
        let title = p.id;
        
        // Attempt to extract title and funds from the description if we packed them
        if (details.description && details.description.includes('---')) {
            const parts = details.description.split('---');
            title = parts[0].trim();
            details.description = parts[1].trim();
            if (parts.length > 2) {
               reqFunds = parseInt(parts[2].replace(/\D/g, ''), 10) || 0;
            }
        }
        
        proposals.push({
          id: details.id,
          title: title,
          description: details.description,
          state: details.status,
          creator: "0x...", // not provided by get_proposal
          requestedFunds: reqFunds,
          aiReasoning: details.ai_summary,
          riskScore: p.risk,
          votesFor: details.votes_for,
          votesAgainst: details.votes_against,
          deliveryUrl: details.delivery_url,
          deliverySummary: details.delivery_summary,
          createdAt: new Date().toISOString()
        });
      }
      return proposals;
    } catch (e: any) {
      console.error("Failed to load proposals:", e);
      return [];
    }
  },

  getConstitution: async () => {
    try {
      const address = getContractAddress();
      if (address === "0x0000000000000000000000000000000000000000") return "";
      const res = await schedule(() => getGenLayerClient().readContract({
        address: address as `0x${string}`,
        functionName: 'get_constitution',
        args: []
      }));
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (e: any) {
      return "1. The DAO funds shall only be used for public goods.\n2. Proposals must have clear deliverables.";
    }
  },

  getTreasuryBalance: async () => {
    try {
      const address = getContractAddress();
      if (address === "0x0000000000000000000000000000000000000000") return 0;
      const res = await schedule(() => getGenLayerClient().readContract({
        address: address as `0x${string}`,
        functionName: 'get_treasury_balance',
        args: []
      }));
      return parseInt(res as string) || 0;
    } catch (e: any) {
      return 0;
    }
  },

  fundTreasury: async (creator: string, amount: number) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'fund_treasury',
      args: [],
      value: BigInt(amount),
      // @ts-ignore
      account: { address: creator }, 
    });
    return await waitForGenLayerTransaction(res);
  },

  submitProposal: async (title: string, description: string, reqFunds: number, creator: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Cannot submit transaction: Contract is not yet deployed.");
    }
    
    // Pack title and funds into description since contract only takes id and description
    const packedDescription = `${title}\n---\n${description}\n---\nFunds: ${reqFunds}`;
    const id = `prop-${Date.now()}`;
    
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'create_proposal',
      args: [id, packedDescription, reqFunds],
      value: 0n,
      // @ts-ignore
      account: { address: creator }, 
    });
    
    const receipt = await waitForGenLayerTransaction(res);
    if (receipt.consensus_data?.leader_receipt?.[0]?.execution_result === 'ERROR') {
         let errMsg = receipt.consensus_data.leader_receipt[0].genvm_result.stderr || "Unknown Error";
         const lines = errMsg.split('\n');
         const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || errMsg;
         throw new Error("Contract execution failed: " + lastLine);
    }
    return receipt;
  },

  evaluateProposal: async (id: string, creator: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Cannot evaluate proposal: Contract is not yet deployed.");
    }

    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'tally_votes',
      args: [id],
      value: 0n,
      // @ts-ignore
      account: { address: creator }
    });
    
    const receipt = await waitForGenLayerTransaction(res);
    if (receipt.consensus_data?.leader_receipt?.[0]?.execution_result === 'ERROR') {
         let errMsg = receipt.consensus_data.leader_receipt[0].genvm_result.stderr || "Unknown Error";
         const lines = errMsg.split('\n');
         const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || errMsg;
         throw new Error("Contract execution failed: " + lastLine);
    }
    return receipt;
  },

  castVote: async (id: string, support: boolean, voter: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Cannot vote: Contract is not yet deployed.");
    }
    
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'vote_on_proposal',
      args: [id, support],
      value: 0n,
      // @ts-ignore
      account: { address: voter }
    });
    return await waitForGenLayerTransaction(res);
  },

  finalizeProposal: async (id: string, creator: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Cannot finalize: Contract is not yet deployed.");
    }
    
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'finalize_proposal',
      args: [id],
      value: 0n,
      // @ts-ignore
      account: { address: creator }
    });
    return await waitForGenLayerTransaction(res);
  },

  vetoProposal: async (id: string, admin: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'veto_proposal',
      args: [id],
      value: 0n,
      // @ts-ignore
      account: { address: admin }
    });
    return await waitForGenLayerTransaction(res);
  },

  fileAppeal: async (id: string, reason: string, creator: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'file_appeal',
      args: [id, reason],
      value: 0n,
      // @ts-ignore
      account: { address: creator }
    });
    return await waitForGenLayerTransaction(res);
  },

  submitDelivery: async (id: string, url: string, creator: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'submit_delivery',
      args: [id, url],
      value: 0n,
      // @ts-ignore
      account: { address: creator }
    });
    return await waitForGenLayerTransaction(res);
  },

  verifyAndPayout: async (id: string, owner: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'verify_and_payout',
      args: [id],
      value: 0n,
      // @ts-ignore
      account: { address: owner }
    });
    const receipt = await waitForGenLayerTransaction(res);
    if (receipt.consensus_data?.leader_receipt?.[0]?.execution_result === 'ERROR') {
         let errMsg = receipt.consensus_data.leader_receipt[0].genvm_result.stderr || "Unknown Error";
         const lines = errMsg.split('\n');
         const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || errMsg;
         throw new Error("Delivery verification failed: " + lastLine);
    }
    return receipt;
  },

  addMember: async (targetAddress: string, owner: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'add_member',
      args: [targetAddress],
      value: 0n,
      // @ts-ignore
      account: { address: owner }
    });
    return await waitForGenLayerTransaction(res);
  },

  amendConstitution: async (rules: string, owner: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'amend_constitution',
      args: [rules],
      value: 0n,
      // @ts-ignore
      account: { address: owner }
    });
    return await waitForGenLayerTransaction(res);
  },

  getReputation: async (target: string) => {
    try {
      const address = getContractAddress();
      if (address === "0x0000000000000000000000000000000000000000") return 0;
      const res = await schedule(() => getGenLayerClient().readContract({
        address: address as `0x${string}`,
        functionName: 'get_reputation',
        args: [target]
      }));
      return parseInt(res as string) || 0;
    } catch (e: any) {
      return 0;
    }
  },

  auditLiveProject: async (id: string, caller: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'audit_live_project',
      args: [id],
      value: 0n,
      // @ts-ignore
      account: { address: caller }
    });
    return await waitForGenLayerTransaction(res);
  },

  raiseDispute: async (id: string, reason: string, caller: string) => {
    const address = getContractAddress();
    if (address === "0x0000000000000000000000000000000000000000") throw new Error("Contract not deployed.");
    const res = await getGenLayerClient().writeContract({
      address: address as `0x${string}`,
      functionName: 'raise_dispute',
      args: [id, reason],
      value: 0n,
      // @ts-ignore
      account: { address: caller }
    });
    return await waitForGenLayerTransaction(res);
  },

  deployContract: async (creator: string, code: string) => {
    // @ts-ignore
    const txHash = await getGenLayerClient().deployContract({
      // @ts-ignore
      account: { address: creator },
      code: code,
      args: ["1. The DAO funds shall only be used for public goods.\n2. Proposals must have clear deliverables."]
    });
    
    // Wait for it
    const receipt = await waitForGenLayerTransaction(txHash);
    
    // Check for errors
    if (receipt.consensus_data?.leader_receipt?.[0]?.execution_result === 'ERROR') {
         let errMsg = receipt.consensus_data.leader_receipt[0].genvm_result.stderr || "Unknown Error";
         const lines = errMsg.split('\n');
         const lastLine = lines[lines.length - 1] || lines[lines.length - 2] || errMsg;
         throw new Error("Contract execution failed: " + lastLine);
    }
    
    const contractAddress = receipt.contract_snapshot?.contract_address || receipt.recipient;
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Failed to extract contract address from transaction.");
    }
    
    return contractAddress;
  }
};


export const deployNewContract = async (contractCode: string, address?: string) => {
    const client = getGenLayerClient();
    try {
        const result = await client.deployContract({
            code: contractCode,
            account: address ? { address } : undefined,
            args: ["1. The DAO funds shall only be used for public goods.\n2. Proposals must have clear deliverables."]
        });
        const txHash = typeof result === 'string' ? result : result.hash || result;
        
        let tx: any = null;
        try {
            tx = await client.waitForTransactionReceipt({
                hash: txHash as `0x${string}`,
                status: 'ACCEPTED',
                interval: 5000,
                retries: 120
            });
        } catch(e) {
            tx = await client.getTransaction({ hash: txHash as any });
        }
        
        // Comprehensive address extraction based on various SDK versions
        const extractAddress = (obj: any) => {
            if (!obj) return null;
            return obj.txDataDecoded?.contractAddress ||
                   obj.tx_data_decoded?.contractAddress ||
                   obj.tx_data_decoded?.contract_address ||
                   obj.contractAddress ||
                   obj.contract_address ||
                   obj.data?.contract_address ||
                   obj.data?.contractAddress ||
                   obj.receipt?.contractAddress;
        };
        
        const contractAddr = extractAddress(tx) || extractAddress(tx?.receipt) || extractAddress(tx?.data);
        
        if (contractAddr) {
            setContractAddress(contractAddr);
            return true;
        } else {
            console.error("Full TX Object:", tx);
            throw new Error("Could not extract contract address from final transaction data.");
        }
    } catch(e: any) {
        console.error("Deploy failed", e);
        alert("Deployment failed: " + (e.message || String(e)));
    }
    return false;
};
