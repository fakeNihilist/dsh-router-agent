/**
 * Print the capability probe for this plugin.
 *
 *   node tools/probe.mjs                  # last persisted probe from .dsh_RA
 *   node tools/probe.mjs <token-url>      # live probe from a running DSH Web
 *
 * The Host writes `.dsh_RA/diagnostics/probe.json` on the first project read.
 * The live form is useful immediately after a DSH upgrade; pass the URL printed
 * by `dsh --profile ... web`.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const project = process.env.DSH_RA_PROJECT ?? 'D:/tmp/dsh-ra-test';
const tokenUrl = process.argv[2];

async function live(url) {
  const response = await fetch(url, { redirect: 'manual' });
  const cookies = (response.headers.getSetCookie?.() ?? []).map((value) => value.split(';')[0]);
  const cookie = cookies.join('; ');
  const origin = new URL(url).origin;
  const probeResponse = await fetch(`${origin}/api/router/probe`, {
    headers: { accept: 'application/json', ...(cookie ? { cookie } : {}) },
  });
  if (!probeResponse.ok) throw new Error(`probe route returned HTTP ${probeResponse.status}`);
  return probeResponse.json();
}

try {
  const result = tokenUrl
    ? await live(tokenUrl)
    : JSON.parse(await readFile(join(project, '.dsh_RA', 'diagnostics', 'probe.json'), 'utf8'));
  console.log(JSON.stringify(result, null, 2));
  const probe = result.probe ?? result;
  const blockers = result.blockers ?? [];
  if (blockers.length > 0) {
    console.error(`blockers: ${blockers.join(', ')}`);
    process.exitCode = 1;
  }
  if (probe.sessionController?.fork === false) console.error('fork is unavailable');
  if (probe.fetch === false) console.error('authenticated /api fetch is unavailable');
} catch (error) {
  console.error(`probe unavailable: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`expected ${join(project, '.dsh_RA', 'diagnostics', 'probe.json')} or a DSH Web token URL`);
  process.exitCode = 1;
}
