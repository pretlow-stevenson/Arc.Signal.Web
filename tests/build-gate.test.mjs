import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root, listPublicFiles } from '../scripts/site-files.mjs';

// This fixture launches a separate test runner, not a nested node:test run.
const childEnvironment = { ...process.env };
delete childEnvironment.NODE_TEST_CONTEXT;

// Execute the real gate in an isolated repository, without recursively running
// this test or changing reviewed public assets.
test('production build runs a newly added suite before exporting public files', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-build-gate-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'scripts'));
  await mkdir(join(directory, 'tests'));
  for (const script of ['build.mjs', 'site-files.mjs']) {
    await copyFile(join(root, 'scripts', script), join(directory, 'scripts', script));
  }
  // Valid public assets remove an incidental ENOENT safety net: a skipped
  // regression would otherwise really export this site and falsely succeed.
  for (const path of await listPublicFiles()) {
    const target = join(directory, path);
    await mkdir(join(target, '..'), { recursive: true });
    await copyFile(join(root, path), target);
  }
  await writeFile(join(directory, 'tests/new_release_contract.test.mjs'),
    "import test from 'node:test'; test('new release regression', () => { throw new Error('EXPECTED_BUILD_GATE_FAILURE'); });\n");
  for (const context of [undefined, 'child-v8']) {
    const environment = { ...childEnvironment };
    if (context) environment.NODE_TEST_CONTEXT = context;
    const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
      cwd: directory, encoding: 'utf8', timeout: 15_000, env: environment,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /EXPECTED_BUILD_GATE_FAILURE/);
    assert.doesNotMatch(result.stdout, /Static build:/);
  }
});

test('production build rejects an empty regression directory', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'arc-signal-build-empty-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'scripts'));
  await mkdir(join(directory, 'tests'));
  for (const script of ['build.mjs', 'site-files.mjs']) {
    await copyFile(join(root, 'scripts', script), join(directory, 'scripts', script));
  }
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: directory, encoding: 'utf8', timeout: 15_000, env: childEnvironment,
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /No website regression suites found/);
  assert.doesNotMatch(result.stdout, /Static build:/);
});
