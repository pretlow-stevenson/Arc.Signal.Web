import { copyFile, mkdir, mkdtemp, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root, listPublicFiles } from './site-files.mjs';

// Build only after validation, into a fresh public-only directory. No cleanup
// or recursive deletion of an existing checkout/output directory is needed.
// Discover every first-party website suite. A hand-maintained subset silently
// omitted newer recognition, session-deletion and phone-free Watch contracts.
// Keep upstream theme tests separate; those are verified by its own release gate.
const suites = (await readdir(join(root, 'tests'), { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.test.mjs'))
  .map(entry => entry.name).sort().map(name => `tests/${name}`);
if (suites.length === 0) throw new Error('No website regression suites found');
// This is a distinct regression runner even when a caller is itself a test.
// Inheriting node:test's worker marker can skip all suites and falsely succeed.
const regressionEnvironment = { ...process.env };
delete regressionEnvironment.NODE_TEST_CONTEXT;
const result = spawnSync(process.execPath, ['--test', ...suites], {
  cwd: root, stdio: 'inherit', env: regressionEnvironment,
});
if (result.error || result.status !== 0) process.exit(1);
const files = await listPublicFiles();
const destination = await mkdtemp(join(tmpdir(), 'arc-signal-site-'));
for (const relative of files) {
  const target = join(destination, relative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(root, relative), target);
}
console.log(`Validated ${files.length} public files. Static build: ${destination}`);
