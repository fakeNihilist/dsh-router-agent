import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Serialize work per filesystem key. The plugin writes several sidecar files
 * for one project; a per-project chain keeps read-modify-write sequences from
 * interleaving without inventing a global lock.
 */
const chains = new Map();

export function withLock(key, work) {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.then(work, work);
  const settled = next.then(
    () => undefined,
    () => undefined,
  );
  chains.set(key, settled);
  settled.then(() => {
    if (chains.get(key) === settled) chains.delete(key);
  });
  return next;
}

const LOCK_DIR = '.lock';
const STALE_MS = 15_000;
const WAIT_MS = 5_000;
const RETRY_MS = 25;

/**
 * Best-effort cross-process lock for one project sidecar.
 *
 * More than one DSH Host can serve the same project (Desktop plus `dsh web`).
 * `withLock` only serializes within one process, so every sidecar
 * read-modify-write also takes an exclusive directory lock. A crashed owner
 * leaves the directory behind; it is broken once its owner record is older
 * than `STALE_MS`, and a waiter that cannot acquire within `WAIT_MS` breaks it
 * rather than failing the user's operation.
 *
 * @param {string} root Project sidecar root.
 * @param {() => Promise<unknown>} work Critical section.
 * @returns {Promise<unknown>} the critical section's result.
 */
export async function withFileLock(root, work) {
  const lockDir = join(root, LOCK_DIR);
  const ownerPath = join(lockDir, 'owner.json');
  const started = Date.now();
  let acquired = false;
  while (!acquired) {
    try {
      await mkdir(lockDir);
      try {
        await writeFile(ownerPath, `${JSON.stringify({ pid: process.pid, at: Date.now() })}\n`, 'utf8');
      } catch (error) {
        await rm(lockDir, { recursive: true, force: true }).catch(() => {});
        throw error;
      }
      acquired = true;
      break;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
    let stale = false;
    try {
      const owner = JSON.parse(await readFile(ownerPath, 'utf8'));
      stale = Date.now() - Number(owner.at) > STALE_MS;
    } catch {
      const info = await stat(lockDir).catch(() => null);
      stale = !info || Date.now() - info.mtimeMs > STALE_MS;
    }
    if (stale || Date.now() - started > WAIT_MS) {
      await rm(lockDir, { recursive: true, force: true }).catch(() => {});
      continue;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
  try {
    return await work();
  } finally {
    await rm(lockDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export function dirOf(file) {
  return dirname(file);
}
