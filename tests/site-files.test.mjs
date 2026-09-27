import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { documents, publicAssets, listPublicFiles } from '../scripts/site-files.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-public-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const file of [...documents, 'CNAME', 'robots.txt', 'sitemap.xml', ...publicAssets]) {
    await mkdir(dirname(join(directory, file)), { recursive: true });
    await writeFile(join(directory, file), 'Public fixture');
  }
  return directory;
}

test('public asset manifest retains all reviewed files and rejects private-looking or ordinary unreviewed assets', async t => {
  const directory = await fixture(t);
  assert.equal((await listPublicFiles(directory)).length, documents.length + 3 + publicAssets.length);
  for (const name of ['assets/data/scan.json', 'assets/images/capture.png', 'assets/data/AuthKey.p8', 'assets/data/.env']) {
    await writeFile(join(directory, name), 'Fixture only, not private data');
    await assert.rejects(listPublicFiles(directory), /not publishable/);
    await rm(join(directory, name));
  }
  await mkdir(join(directory, 'assets/unreviewed'));
  await assert.rejects(listPublicFiles(directory), /Unreviewed asset directory/);
});

test('publication rejects missing approved assets and symlink substitutions', async t => {
  const directory = await fixture(t);
  const file = join(directory, 'assets/data/spectra-guide.json');
  await rm(file);
  await assert.rejects(listPublicFiles(directory), /Missing reviewed public asset/);
  await symlink(join(directory, 'CNAME'), file);
  await assert.rejects(listPublicFiles(directory), /symlink is not publishable/);
});
