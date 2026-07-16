// Injected by GenLayer Advanced Architecture
const MIN_GAP_MS = 350;
const MAX_RETRIES = 4;
let queue = Promise.resolve();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isRateLimit(e: any): boolean {
  const msg = (e?.message || String(e)).toLowerCase();
  return msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit");
}

export function schedule<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    let attempt = 0;
    while (true) {
      try {
        return await task();
      } catch (e) {
        if (isRateLimit(e) && attempt < MAX_RETRIES) {
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
  return run as Promise<T>;
}
