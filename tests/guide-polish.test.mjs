import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';
import {escapeHTML} from '../scripts/guide-inline.mjs';

const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
const html = await readFile(join(root, 'guide.html'), 'utf8');

test('Guide groups all stable topics by the reader task without omissions', () => {
  const groups = new Map([
    ['gettingStarted', ['setup', 'detection', 'travel', 'watch']],
    ['understandingResults', ['bluetooth', 'magnetic', 'grouping', 'monitoring', 'limitations']],
    ['savedSessionsAndSharing', ['sessions', 'exporting', 'privacy']],
    ['troubleshooting', ['troubleshooting']],
  ]);
  assert.deepEqual([...new Set(guide.articles.map(x => x.category))], [...groups.keys()]);
  for (const [category, topics] of groups) {
    assert.deepEqual(guide.articles.filter(x => x.category === category).map(x => x.content.id), topics);
  }
  assert.equal(guide.articles.length, 13);
});

test('Every public topic keeps cautions and practical steps before detailed reading', () => {
  for (const {content: article} of guide.articles) {
    const body = html.split(`<article id="${article.id}" class="guide-topic">`)[1]?.split('</article>')[0];
    assert.ok(body, article.id);
    const warning = body.indexOf('<strong>Important to know</strong>');
    const steps = body.indexOf('<h3>What to try</h3>');
    const explanation = body.indexOf(`<h3>${escapeHTML(article.sections[0].title)}</h3>`);
    const technical = body.indexOf('<details><summary>Technical detail</summary>');
    assert.ok(warning >= 0 && warning < steps && steps < explanation && explanation < technical, article.id);
  }
});

test('Bluetooth help distinguishes the collector from new iPhone proximity measurements', () => {
  const article = guide.articles.find(x => x.content.id === 'bluetooth').content;
  const bands = article.sections.find(x => x.id === 'bands').body;
  assert.match(bands, /collecting iPhone or Watch/);
  assert.match(bands, /fresh \*\*Bluetooth Proximity\*\* check measures on your iPhone/);
  assert.doesNotMatch(bands, /signal received by your iPhone\./);
});
