import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';

const text = file => readFile(join(root, file), 'utf8');
const product = await text('spectra.html');
const magnetic = await text('content/support/magnetic-meter.html');
const magneticRow = product.match(/<article><span class="measurement-number" aria-hidden="true">03<\/span><h3>Magnetic field<\/h3>([\s\S]*?)<\/article>/)?.[1];

test('magnetic product copy leads with a conditional inspection benefit and nearby limits', () => {
  assert.ok(magneticRow);
  const paragraphs = [...magneticRow.matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map(match => match[1]);
  assert.equal(paragraphs.length, 4);
  assert.match(paragraphs[0], /Look for clues to concealed electronics/);
  assert.match(paragraphs[0], /may detect at close range—even without a recognizable wireless broadcast/);
  assert.match(paragraphs[0], /careful physical inspection/);
  assert.match(paragraphs[0], /repeatable changes.*closer look/);
  assert.match(paragraphs[1], /cannot identify a camera or microphone or prove recording/);
  assert.match(paragraphs[1], /Ordinary magnets, magnetic metal, chargers and phone accessories/);
  assert.match(paragraphs[1], /quiet reading does not rule one out/);
  assert.match(paragraphs[2], /Available in Area Sweep/);
  assert.match(paragraphs[2], /larger positive or negative delta.*not a distance/);
  assert.match(paragraphs[2], /its own calibrated baseline/);
  assert.match(paragraphs[3], /location varies by model/);
  assert.match(paragraphs[3], /href="help\/magnetic-meter.html"/);
  assert.doesNotMatch(magneticRow, /find silent cameras|reliable hidden-camera detection|detects RF|detect powered-off devices/i);
});

test('the genuine Area Sweep screenshot explains why to use the meter without changing scope', () => {
  const figure = product.match(/<figure><a href="assets\/images\/spectra-area-sweep\.webp[\s\S]*?<\/figure>/)?.[0];
  assert.ok(figure);
  assert.match(figure, /width="1320" height="2868"/);
  assert.match(figure, /graph with an example excursion/);
  assert.match(figure, /Look beyond wireless signals/);
  assert.match(figure, /Repeatable, close-range magnetic changes may guide a closer physical look—not identify a device/);
  assert.match(figure, /available in Area Sweep; Quick Check focuses on radio signals/);
  assert.match(product, /Readings are simulated examples, not evidence of nearby devices/);
});

test('magnetic help introduces purpose, interference and no-all-clear limits before setup', () => {
  const introduction = magnetic.split('<h2')[0];
  for (const phrase of ['Look for clues to concealed electronics', 'may detect at close range',
    'without a recognizable wireless broadcast', 'allowed to inspect', 'repeatable changes',
    'closer physical look', 'not as proof of a hidden device', 'cannot identify a device',
    'measure its distance', 'reveal its intent', 'prove that it is recording',
    'magnetic metal', 'Some cameras, microphones', 'No change is not an all-clear']) {
    assert.ok(introduction.includes(phrase), phrase);
  }
});

test('related website entry points explain the benefit and lead to honest practical help', async () => {
  const homepage = await text('index.html');
  assert.match(homepage, /close-range magnetic changes to guide a closer physical look—not to confirm a hidden device/);
  for (const file of ['content/support/getting-started.html', 'content/support/travel.html']) {
    const html = await text(file);
    for (const phrase of ['close-range', 'concealed', 'recognizable wireless broadcast',
      'magnetic metal', 'no change does not rule out a device', 'https://arcsignal.app/help/magnetic-meter.html']) {
      assert.ok(html.includes(phrase), `${file}: ${phrase}`);
    }
  }
  const inventory = JSON.parse(await text('content/support/articles.json'));
  const entry = inventory.find(article => article.slug === 'magnetic-meter');
  assert.match(entry.description, /close-range magnetic clues.*closer physical look.*clear limits/);
  assert.ok((await text('support.html')).includes(entry.description));
  assert.ok((await text('help/magnetic-meter.html')).includes('Look for clues to concealed electronics'));
});
