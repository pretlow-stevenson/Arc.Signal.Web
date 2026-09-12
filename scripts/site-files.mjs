import { readdir, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const documents = ['index.html', 'spectra.html', 'seamless.html', 'guide.html', '404.html'];
const publicFiles = [...documents, 'CNAME', 'robots.txt', 'sitemap.xml'];

// One explicit public surface for validation and export. Never follow symlinks
// or publish Git metadata, development scripts, credentials, or test artifacts.
export async function listPublicFiles() {
  const files = [...publicFiles];
  async function walk(relative) {
    const entries = await readdir(join(root, relative), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) throw new Error(`Hidden asset is not publishable: ${entry.name}`);
      const path = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Asset symlink is not publishable: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Unsupported asset type: ${path}`);
    }
  }
  if (!(await lstat(join(root, 'assets'))).isDirectory()) throw new Error('Expected a real assets directory');
  await walk('assets');
  for (const path of files) {
    if (!(await lstat(join(root, path))).isFile()) throw new Error(`Expected a regular public file: ${path}`);
  }
  return files;
}
