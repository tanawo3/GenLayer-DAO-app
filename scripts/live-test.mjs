import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitForConsensus(client, hash, { timeoutMs = 420000, intervalMs = 6000 } = {}) {
  const start = Date.now();
  const done = new Set(['ACCEPTED', 'FINALIZED']);
  const failed = new Set(['UNDETERMINED', 'CANCELED']);
  let last = '';
  
  console.log(`Waiting for LLM consensus on tx ${hash}...`);
  while (Date.now() - start < timeoutMs) {
    let tx;
    try {
      tx = await client.getTransaction({ hash });
    } catch {
      await sleep(intervalMs);
      continue;
    }
    
    const status = tx?.statusName ?? String(tx?.status ?? '');
    if (status && status !== last) {
      process.stdout.write(`  …${status}\n`);
      last = status;
    }
    if (done.has(status)) return tx;
    if (failed.has(status)) throw new Error(`transaction ${status}`);
    
    await sleep(intervalMs);
  }
  throw new Error('timed out waiting for consensus');
}

export async function readWithRetry(client, address, functionName, args = []) {
  for (let i = 0; i < 5; i++) {
    try {
      return await client.readContract({ address, functionName, args });
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (/rate limit|exceeds defined limit|429/i.test(msg) && i < 4) {
        await sleep(1500 * (i + 1));
        continue;
      }
      throw err;
    }
  }
}
