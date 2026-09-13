import { copyFile, mkdir, mkdtemp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { root, listPublicFiles } from './site-files.mjs';

// Build only after validation, into a fresh public-only directory. No cleanup
// or recursive deletion of an existing checkout/output directory is needed.
const result = spawnSync(process.execPath, ['--test', 'tests/site.test.mjs', 'tests/motion.test.mjs'], { cwd: root, stdio: 'inherit' });
if (result.error || result.status !== 0) process.exit(1);
const files = await listPublicFiles();
const destination = await mkdtemp(join(tmpdir(), 'arc-signal-site-'));
for (const relative of files) {
  const target = join(destination, relative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(root, relative), target);
}
console.log(`Validated ${files.length} public files. Static build: ${destination}`);
