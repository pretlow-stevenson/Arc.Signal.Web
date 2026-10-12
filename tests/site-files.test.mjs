import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { documents, supportDocuments, publicAssets, listPublicFiles } from '../scripts/site-files.mjs';

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

test('support publication is exactly one hub and ten reviewed articles, not its source manuscripts', async t => {
  assert.deepEqual(supportDocuments, ['support.html', 'help/getting-started.html', 'help/travel.html',
    'help/findings.html', 'help/magnetic-meter.html', 'help/monitoring.html', 'help/troubleshooting.html',
    'help/sessions.html', 'help/apple-watch.html', 'help/about.html', 'help/contact.html']);
  assert.equal(new Set(documents).size, documents.length);
  const directory = await fixture(t);
  await mkdir(join(directory, 'content/support'), { recursive: true });
  await writeFile(join(directory, 'content/support/private-note.html'), 'Not a publication input');
  const files = await listPublicFiles(directory);
  assert.deepEqual(files.filter(path => supportDocuments.includes(path)), supportDocuments);
  assert.ok(files.every(path => !path.startsWith('content/') && !path.startsWith('docs/') && !path.startsWith('zendesk/')));
});

test('help rejects unreviewed files, nested directories, missing pages and leaf symlinks', async t => {
  const directory = await fixture(t);
  for (const name of ['private-capture.json', 'extra.html', '.env']) {
    await writeFile(join(directory, 'help', name), 'Fixture only');
    await assert.rejects(listPublicFiles(directory), /Unreviewed help entry/);
    await rm(join(directory, 'help', name));
  }
  await mkdir(join(directory, 'help/nested'));
  await assert.rejects(listPublicFiles(directory), /Unreviewed help entry/);
  await rm(join(directory, 'help/nested'), { recursive: true });
  const page = join(directory, 'help/contact.html');
  await rm(page);
  await assert.rejects(listPublicFiles(directory), /ENOENT/);
  await symlink(join(directory, 'CNAME'), page);
  await assert.rejects(listPublicFiles(directory), /Help symlink is not publishable/);
});

test('help parent must be a real directory even if symlinked children look like regular files', async t => {
  const directory = await fixture(t);
  await rename(join(directory, 'help'), join(directory, 'private-help'));
  await symlink(join(directory, 'private-help'), join(directory, 'help'));
  await assert.rejects(listPublicFiles(directory), /Expected a real help directory/);
});
