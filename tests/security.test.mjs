import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createAppServer } from '../server.mjs';
import { convert } from '../dist/converter.mjs';
test('local static server restricts methods, assets and symlinks', async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), 'inoquill-'));
  const root = path.join(folder, 'public'); await mkdir(root);
  await writeFile(path.join(root, 'index.html'), '<!doctype html><title>Test</title>');
  await writeFile(path.join(folder, 'secret.txt'), 'PRIVATE');
  await symlink(path.join(folder, 'secret.txt'), path.join(root, 'escape.md'));
  await writeFile(path.join(root, '.secret.md'), 'PRIVATE');
  const server = createAppServer(root); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const good = await fetch(base); assert.equal(good.status, 200);
    assert.match(good.headers.get('content-security-policy'), /connect-src 'none'/);
    assert.match(good.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(good.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await fetch(base, { method: 'POST', body: 'secret' })).status, 405);
    assert.equal((await fetch(base + '/escape.md')).status, 403);
    assert.equal((await fetch(base + '/.secret.md')).status, 403);
    assert.equal((await fetch(base + '/%00.md')).status, 403);
    assert.equal((await fetch(base + '/%ZZ')).status, 400);
    assert.equal((await fetch(base + '/index.html', { method: 'HEAD' })).status, 200);
    assert.equal(await (await fetch(base + '/index.html', { method: 'HEAD' })).text(), '');
  } finally { await new Promise(resolve => server.close(resolve)); await rm(folder, { recursive: true, force: true }); }
});
test('deterministic malformed-input corpus returns bounded diagnostics', () => {
  let seed = 0x12345678; const alphabet = '{}();[]#"\'xyz012/\\\n+-';
  for (let i = 0; i < 300; i++) {
    let source = ''; for (let j = 0; j < 100; j++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; source += alphabet[seed % alphabet.length]; }
    const result = convert(source); assert.equal(typeof result.ok, 'boolean'); assert.ok(result.diagnostics.length <= 5000); if (!result.ok) assert.equal(result.script, '');
  }
});
