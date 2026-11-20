import { mkdir, open, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Read JSON, returning `fallback` for a missing or corrupt file. */
export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Atomically replace one JSON file (temp file + rename). */
export async function writeJson(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await renameWithRetry(temp, file);
}

/** Atomically replace one text file (temp file + rename). */
export async function writeText(file, text) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(temp, text, 'utf8');
  await renameWithRetry(temp, file);
}

/**
 * Windows can refuse a rename while another reader holds the target without
 * delete sharing (the Router reads dispatch history every poll). Retry the
 * replace briefly instead of failing the write.
 */
async function renameWithRetry(temp, file) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(temp, file);
      return;
    } catch (error) {
      if (attempt >= 4 || (error?.code !== 'EPERM' && error?.code !== 'EBUSY' && error?.code !== 'EACCES')) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
}

/** Append one JSON line with a single write. */
export async function appendJsonLine(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const { appendFile } = await import('node:fs/promises');
  await appendFile(file, `${JSON.stringify(value)}\n`, 'utf8');
}

/** Replace a JSONL file with the given rows. */
export async function writeJsonLines(file, values) {
  await writeText(file, values.map((value) => JSON.stringify(value)).join('\n') + (values.length ? '\n' : ''));
}

function parseLines(text) {
  const values = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      values.push(JSON.parse(line));
    } catch {
      // A torn line is expected after a crash; complete lines stay.
    }
  }
  return values;
}

/** Read JSONL, skipping a torn final line. */
export async function readJsonLines(file) {
  try {
    return parseLines(await readFile(file, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Read only the tail of a JSONL file.
 *
 * Dispatch history grows for the life of a project, while every state poll
 * needs only the newest rows. Reading a bounded tail keeps that poll O(1) in
 * file size; a partial first line is dropped unless the whole file fits.
 *
 * @param {string} file JSONL path.
 * @param {number} maxBytes Tail budget.
 * @returns {Promise<object[]>} parsed rows from the tail, oldest first.
 */
export async function readJsonLinesTail(file, maxBytes = 2 * 1024 * 1024) {
  let handle;
  try {
    handle = await open(file, 'r');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  try {
    const info = await handle.stat();
    const size = info.size;
    const length = Math.min(size, Math.max(1, maxBytes));
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);
    let text = buffer.toString('utf8');
    if (length < size) {
      const first = text.indexOf('\n');
      text = first >= 0 ? text.slice(first + 1) : '';
    }
    return parseLines(text);
  } finally {
    await handle.close().catch(() => {});
  }
}
