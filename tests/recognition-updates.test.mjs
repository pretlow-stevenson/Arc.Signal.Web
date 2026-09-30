import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('included recognition improvements have consistent scope across public content', () => {
  for (const file of ['index.html', 'spectra.html', 'docs/zendesk-getting-started-article.html',
    'docs/zendesk-session-article.html', 'docs/zendesk-about-article.html']) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const phrase of ['device catalog and detection engine', 'App Store updates at no additional charge']) {
      assert.ok(text.includes(phrase), `${file}: ${phrase}`);
    }
    assert.doesNotMatch(text, /lifetime updates|guaranteed recognition|continuous catalog downloads/i);
  }
  const guide = JSON.parse(readFileSync(new URL('../assets/data/spectra-guide.json', import.meta.url), 'utf8'));
  const section = guide.articles.find(a => a.content.id === 'detection').content.sections.find(s => s.id === 'recognition-updates');
  assert.ok(section.body.includes('at no additional charge'));
  assert.ok(section.body.includes('no separate catalog download or subscription'));
  assert.ok(section.body.includes('does not guarantee a match'));
});
