import { readdir, lstat, mkdir, copyFile, mkdtemp } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const themeRoot = fileURLToPath(new URL('../theme/', import.meta.url));
const files = ['manifest.json', 'script.js', 'style.css', 'thumbnail.png', 'LICENSE'];
const folders = ['assets', 'settings', 'templates', 'translations'];
const extensions = {
  assets: /\.(?:js|css|json|svg|png|jpg|jpeg|gif|webp|woff|woff2)$/i,
  settings: /\.(?:png|jpg|jpeg|gif|svg|webp|ico)$/i,
  templates: /\.hbs$/,
  translations: /\.json$/,
};

export async function packageFiles(root = themeRoot) {
  const output = [...files];
  async function walk(relative, folder) {
    for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
      const path = `${relative}/${entry.name}`;
      // Upstream's empty directory marker is source metadata, not an asset.
      if (entry.name === '.gitkeep' && entry.isFile()) continue;
      if (entry.name.startsWith('.') || /[\r\n]/.test(entry.name) || entry.isSymbolicLink()) {
        throw new Error(`Unsafe theme entry: ${path}`);
      }
      if (entry.isDirectory()) await walk(path, folder);
      else if (entry.isFile() && extensions[folder].test(entry.name)) output.push(path);
      else throw new Error(`Unsupported theme entry: ${path}`);
    }
  }
  for (const folder of folders) {
    const info = await lstat(join(root, folder));
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Unsafe theme directory: ${folder}`);
    await walk(folder, folder);
  }
  let bytes = 0;
  for (const file of output) {
    const info = await lstat(join(root, file));
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe theme file: ${file}`);
    bytes += info.size;
  }
  if (bytes > 20 * 1024 * 1024) throw new Error('Theme exceeds the reviewed 20 MiB package budget');
  return output.sort();
}

export async function packageTheme(root = themeRoot) {
  const selected = await packageFiles(root);
  const destination = await mkdtemp(join(tmpdir(), 'arc-signal-zendesk-'));
  const staging = join(destination, 'theme');
  for (const file of selected) {
    await mkdir(dirname(join(staging, file)), { recursive: true });
    await copyFile(join(root, file), join(staging, file));
  }
  const archive = join(destination, 'arc-signal-support.zip');
  const zipped = spawnSync('zip', ['-q', '-X', archive, ...selected], { cwd: staging, encoding: 'utf8' });
  if (zipped.error || zipped.status !== 0) throw zipped.error ?? new Error(zipped.stderr || 'ZIP failed');
  return { archive, files: selected.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await packageTheme(), null, 2));
}
