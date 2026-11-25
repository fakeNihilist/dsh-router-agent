import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ProjectStore } from '../../src/host/project-store.js';

async function withStore(work) {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ra-store-'));
  try {
    const store = new ProjectStore(dir);
    await store.ensure();
    await work(store, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('ensure creates the sidecar, gitignore and default settings', async () => {
  await withStore(async (store, dir) => {
    const state = await store.read();
    assert.equal(state.settings.layout, 'vertical');
    assert.equal(state.settings.composer.permissions, 'workspace-write');
    assert.equal(state.settings.autoAsk, 'keep');
    assert.equal(state.settings.trackingDays, 7);
    assert.equal(state.onboarding.status, 'awaiting');
    assert.match(await readFile(join(dir, '.dsh_RA', '.gitignore'), 'utf8'), /^\*/);
  });
});

test('stop/restore and explicit pinning survive a reload', async () => {
  await withStore(async (store) => {
    await store.stopSession('s1', { reason: 'manual', parentSessionId: 'p' });
    let state = await store.read();
    assert.equal(state.stopped.s1.reason, 'manual');
    await store.restoreSession('s1');
    await store.update((next) => {
      next.pinned = { s1: true };
    });
    state = await store.read();
    assert.equal(state.stopped.s1, undefined);
    assert.equal(state.pinned.s1, true);
    const reloaded = new ProjectStore(store.project);
    assert.equal((await reloaded.read()).pinned.s1, true);
  });
});

test('titles and lineage are whole-value sidecar facts', async () => {
  await withStore(async (store) => {
    await store.setTitle('c', '新名称', 'manual');
    await store.recordLineage('c', 'p');
    const state = await store.read();
    assert.equal(state.titles.c.title, '新名称');
    assert.equal(state.titles.c.source, 'manual');
    assert.equal(state.lineage.c, 'p');
  });
});

test('briefs, proposals and history round-trip', async () => {
  await withStore(async (store) => {
    await store.saveBrief({
      sessionId: 's1',
      title: 'T',
      summaryStatus: 'fallback',
      summarizedThroughSeq: 9,
      lastActiveAt: 1,
    });
    assert.equal((await store.getBrief('s1')).title, 'T');
    assert.equal((await store.listBriefs()).length, 1);
    await store.saveProposal({ token: 'tok', status: 'pending' });
    assert.equal((await store.getProposal('tok')).status, 'pending');
    assert.equal((await store.listProposals()).length, 1);
    await store.appendHistory({ id: 'h1', result: 'sent' });
    await store.appendHistory({ id: 'h2', result: 'forked' });
    assert.deepEqual((await store.history(10)).map((row) => row.id), ['h1', 'h2']);
  });
});

test('concurrent updates serialize without losing rows', async () => {
  await withStore(async (store) => {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        store.update((state) => {
          state.stopped[`s${index}`] = { at: index };
        }),
      ),
    );
    const state = await store.read();
    assert.equal(Object.keys(state.stopped).length, 20);
    assert.equal(state.stopped.s19.at, 19);
  });
});

test('two stores on one directory merge updates instead of overwriting', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ra-store-'));
  try {
    const left = new ProjectStore(dir);
    const right = new ProjectStore(dir);
    await Promise.all([
      ...Array.from({ length: 10 }, (_, index) =>
        left.update((state) => {
          state.stopped[`l${index}`] = { at: index };
        }),
      ),
      ...Array.from({ length: 10 }, (_, index) =>
        right.update((state) => {
          state.stopped[`r${index}`] = { at: index };
        }),
      ),
    ]);
    const state = await left.read();
    assert.equal(Object.keys(state.stopped).length, 20);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('an older sidecar drops lastSeen and folds tracking.days into settings', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ra-store-'));
  try {
    await mkdir(join(dir, '.dsh_RA'), { recursive: true });
    await writeFile(
      join(dir, '.dsh_RA', 'state.json'),
      JSON.stringify({
        version: 1,
        tracking: { days: 30 },
        settings: { layout: 'vertical' },
        onboarding: { status: 'idle' },
        lastSeen: { s1: 1 },
      }),
      'utf8',
    );
    const store = new ProjectStore(dir);
    const state = await store.read();
    assert.equal(state.lastSeen, undefined);
    assert.equal(state.settings.trackingDays, 30);
    assert.equal(state.onboarding.status, 'awaiting');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a corrupt state file is archived and the defaults are written', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ra-store-'));
  try {
    await mkdir(join(dir, '.dsh_RA'), { recursive: true });
    await writeFile(join(dir, '.dsh_RA', 'state.json'), '{not json', 'utf8');
    const store = new ProjectStore(dir);
    const state = await store.read();
    assert.equal(state.version, 1);
    const files = await readdir(join(dir, '.dsh_RA'));
    assert.ok(files.some((file) => file.startsWith('state.json.corrupt-')));
    assert.equal(await readFile(join(dir, '.dsh_RA', '.gitignore'), 'utf8'), '*\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('an older self-unignoring gitignore is upgraded so git status stays clean', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-ra-store-'));
  try {
    await mkdir(join(dir, '.dsh_RA'), { recursive: true });
    await writeFile(join(dir, '.dsh_RA', '.gitignore'), '*\n!.gitignore\n', 'utf8');
    const store = new ProjectStore(dir);
    await store.read();
    assert.equal(await readFile(join(dir, '.dsh_RA', '.gitignore'), 'utf8'), '*\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('brief paths reject traversal and accept normal session ids', async () => {
  await withStore(async (store) => {
    await assert.rejects(() => store.getBrief('../escape'), /invalid session id/);
    await assert.rejects(() => store.getBrief('a/b'), /invalid session id/);
    assert.equal(await store.getBrief('session-1'), null);
  });
});

test('history trims to the configured row bound', async () => {
  await withStore(async (store) => {
    const bounded = new ProjectStore(store.project, { maxHistory: 20 });
    for (let index = 0; index < 64; index += 1) {
      await bounded.appendHistory({ id: `h${index}`, result: 'sent' });
    }
    const rows = await bounded.history(1000);
    assert.equal(rows.length, 20);
    assert.equal(rows.at(-1).id, 'h63');
  });
});

test('proposal mutation is compare-and-set and pruning keeps fresh proposals', async () => {
  await withStore(async (store) => {
    await store.saveProposal({ token: 'tok', status: 'pending', createdAt: Date.now(), expiresAt: Date.now() + 60_000 });
    const first = await store.mutateProposal('tok', (proposal) =>
      proposal.status === 'pending' ? { ...proposal, status: 'executing' } : null,
    );
    const second = await store.mutateProposal('tok', (proposal) =>
      proposal.status === 'pending' ? { ...proposal, status: 'executing' } : null,
    );
    assert.equal(first.status, 'executing');
    assert.equal(second, null);

    const old = Date.now() - 8 * 24 * 3600 * 1000;
    await store.saveProposal({ token: 'old', status: 'confirmed', createdAt: old, executedAt: old });
    await store.saveProposal({ token: 'new', status: 'confirmed', createdAt: Date.now(), executedAt: Date.now() });
    const removed = await store.pruneProposals(7 * 24 * 3600 * 1000);
    assert.equal(removed, 1);
    assert.equal(await store.getProposal('old'), null);
    assert.ok(await store.getProposal('new'));
  });
});
