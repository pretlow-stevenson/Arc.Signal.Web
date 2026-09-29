import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Watch collection copy distinguishes local capture, capacity, and later review', () => {
  for (const file of ['../spectra.html', '../docs/zendesk-watch-article.html']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const phrase of ['without your iPhone nearby', 'up to five captures in total',
      'Unsent captures are not automatically overwritten', 'display fully awake',
      'paired iPhone to identify signals', 'not identified results']) {
      assert.ok(text.includes(phrase), `${file}: ${phrase}`);
    }
    assert.doesNotMatch(text, /unlimited captures|capture anywhere|no iPhone required/i);
  }
  const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
  const watch = guide.articles.find(a => a.content.id === 'watch').content;
  assert.ok(watch.sections.find(s => s.id === 'phone-free').body.includes('five captures in total'));
  assert.ok(watch.sections.find(s => s.id === 'capacity').body.includes('Unsent or unprocessed evidence is not automatically discarded'));
});
