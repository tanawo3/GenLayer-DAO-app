import { readFileSync } from 'node:fs';
import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import path from 'path';

async function main() {
  const pk = process.env.GENLAYER_PRIVATE_KEY;
  if (!pk) throw new Error("GENLAYER_PRIVATE_KEY is missing from environment");
  
  const account = createAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  const client = createClient({ chain: testnetBradbury, account });
  const code = readFileSync(path.join(__dirname, '../contracts/dao.py'), 'utf-8');

  console.log("Deploying contract...");
  const hash = await client.deployContract({ code, args: [] });
  console.log("Tx Hash:", hash);
  
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: 'ACCEPTED',
    interval: 5000,
    retries: 60,
  });

  // Deep search for address due to SDK shape variance
  const address =
    receipt?.txDataDecoded?.contractAddress ??
    receipt?.data?.contract_address ??
    receipt?.contractAddress;
    
  console.log("Successfully Deployed to:", address);
}
main().catch(console.error);
