import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from '../scripts/site-files.mjs';

test('session deletion guidance distinguishes temporary Undo from bulk erasure', async () => {
  const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
  const sessions = guide.articles.find(article => article.content.id === 'sessions').content;
  const swipe = sessions.sections.find(section => section.id === 'swipe-actions').body;
  assert.match(swipe, /main \*\*Sessions\*\* list, swipe right.*Rename.*Swipe left.*Delete/s);
  for (const [name, value] of [
    ['Guide', swipe],
    ['privacy policy', await readFile(join(root, 'spectra-privacy.html'), 'utf8')],
    ['support article', await readFile(join(root, 'content/support/sessions.html'), 'utf8')],
  ]) {
    const text = value.replace(/<[^>]*>/g, '').replaceAll('**', '');
    assert.match(text, /10 seconds, or 30 seconds when VoiceOver is running at deletion/, name);
    assert.match(text, /most recently deleted/, name);
    assert.match(text, /Another deletion replaces/, name);
    assert.match(text, /(?:Leaving|leave) Sessions/, name);
    assert.match(text, /(?:memory|in-memory)/, name);
    assert.match(text, /no Recently Deleted folder|not in a Recently Deleted folder/, name);
  }
  const erase = sessions.sections.find(section => section.id === 'erase').body;
  assert.match(erase, /Delete Selected.*Erase All Sessions.*Reset Spectra.*clear pending Undo and cannot be undone/);
  assert.match(erase, /Storage\*\* → \*\*Session Storage\*\* for \*\*Erase All Sessions/);
  assert.match(erase, /regardless of search or filters/);
  const largest = sessions.sections.find(section => section.id === 'session-size').body;
  assert.match(largest, /Largest Sessions.*cannot be undone/s);
  assert.match(largest, /only the chosen session, not other saved versions/);
  for (const path of ['spectra-privacy.html', 'content/support/sessions.html']) {
    const text = (await readFile(join(root, path), 'utf8')).replace(/<[^>]*>/g, '');
    assert.match(text, /Storage → Session Storage.*Erase All Sessions/s, path);
    assert.match(text, /regardless of search or filters/, path);
    assert.match(text, /Largest Sessions.*confirmation instead of (?:offering )?Undo/s, path);
    assert.match(text, /does not erase Watch copies or request a Watch reset/, path);
  }
});
