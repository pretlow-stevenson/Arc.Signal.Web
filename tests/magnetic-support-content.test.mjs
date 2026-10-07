import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';

const text = path => readFile(join(root, path), 'utf8');
const magnetic = await text('docs/zendesk-magnetic-article.html');
const inventory = await text('docs/zendesk-help-center.md');
const guide = JSON.parse(await text('assets/data/spectra-guide.json'));
const articleURL = 'https://arcsignal.zendesk.com/hc/en-us/articles/56435559529627';
const section = id => magnetic.split(`<h2 id="${id}">`)[1]?.split('<h2')[0];

test('magnetic support has one canonical full mirror and retains its existing article identity', async () => {
  const supplemental = JSON.parse(await text('docs/zendesk-articles.json'));
  const entry = supplemental.find(article => article.source === 'magnetic');
  assert.equal(entry?.title, 'Use the magnetic meter');
  assert.equal(entry?.section, 'Product Guide');
  assert.equal(entry?.html, magnetic.trim());
  assert.match(inventory, /\| Use the magnetic meter \| 56435559529627 \| Product Guide \| Yes \|/);
  const existing = [
    'h_01M3JZ42BV39CYN5ZBR448HHXG',
    'h_01M3JZ42BV7FDZ17ZF5ZN9P733',
    'h_01M3JZ42BVZEJDMPB8GMFVGMTB',
    'h_01M3JZ42BV4GS9M91XJY9PXKKP',
    'h_01M3JZ42BVK9HHGV61950BVGWB',
  ];
  const ids = [...magnetic.matchAll(/<h2 id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of existing) assert.ok(ids.includes(id), `Missing live anchor ${id}`);
});

test('magnetic support introduces the useful purpose and limits before the workflows', () => {
  const introduction = magnetic.split('<h2')[0];
  for (const fact of ['repeatable changes', 'closer physical look', 'cannot identify a device',
    'measure its distance', 'reveal its intent', 'prove that it is recording',
    'Some cameras, microphones', 'No change is not an all-clear']) {
    assert.ok(introduction.includes(fact), fact);
  }
  assert.match(magnetic, /Do not tamper with equipment or confront someone/);
  assert.match(magnetic, /not a hidden-camera detector or a safety certification/);
  assert.match(magnetic, /<strong>iPhone 17 Pro Max<\/strong>[\s\S]*lower-back area near the USB-C end—not the camera area/);
  assert.match(magnetic, /Do not apply this location to every iPhone/);
  const placement = magnetic.indexOf('<h2 id="h_01M3JZ42BV7FDZ17ZF5ZN9P733">');
  const practice = magnetic.indexOf('<h2 id="h_01M3JZ42BV39CYN5ZBR448HHXG">');
  const sweep = magnetic.indexOf('<h2 id="magnetic-area-sweep">');
  const illustration = magnetic.indexOf('<figure>');
  assert.ok(placement >= 0 && placement < practice && practice < sweep && sweep < illustration,
    'Positioning and safe practice precede collection; the illustration does not displace the tasks');
});

test('practice uses the actual Guide route and never implies saved sweep evidence', () => {
  const practice = section('h_01M3JZ42BV39CYN5ZBR448HHXG');
  assert.ok(practice);
  assert.match(practice, /<strong>Guide<\/strong>[\s\S]*<strong>Reading the magnetic meter<\/strong>[\s\S]*<strong>Practice with the magnetometer<\/strong>[\s\S]*<strong>Start Practice<\/strong>/);
  assert.match(practice, /does not collect Bluetooth or local-network findings, create exports, or save a session/);
  assert.match(practice, /leaving the app clears the readings/);
  assert.match(practice, /Returning does not resume measurement/);
  assert.match(practice, /not calibration or a pass\/fail hardware test/);
  assert.doesNotMatch(practice, /Review graph|Finish Area Sweep|saved events/);
  assert.equal(guide.articles.find(({content}) => content.id === 'magnetic')?.content.title,
    'Reading the magnetic meter');
});

test('the actual magnetic Area Sweep has a separate start-to-finish workflow and saving limits', () => {
  const sweep = section('magnetic-area-sweep');
  assert.ok(sweep);
  assert.equal([...sweep.matchAll(/<li>/g)].length, 4);
  for (const label of ['Scan', 'Area Sweep', 'Motion and magnetic', 'Continue',
    'Begin Area Sweep', 'Finish Area Sweep', 'Coverage', 'Review graph', 'Save completed sessions']) {
    assert.ok(sweep.includes(`<strong>${label}</strong>`), label);
  }
  assert.match(sweep, /Keep Spectra visible and your iPhone unlocked/);
  assert.match(sweep, /when graph data is available/);
  assert.match(sweep, /Check the saved status before closing/);
  assert.match(sweep, /initially allows 30 minutes/);
  assert.match(sweep, /does not enable background measurement or remove graph-retention limits/);
});

test('reading-mode guidance distinguishes the display reference from detection and retained history', () => {
  for (const label of ['Actual Field', 'Actual field', 'Δ Reference', 'Delta from reference',
    'Rebuild Reference', 'Measurement Details', 'Review graph']) {
    assert.ok(magnetic.includes(`<strong>${label}</strong>`), label);
  }
  assert.match(magnetic, /signed difference from your display reference/);
  assert.match(magnetic, /does not reset the independent event detector or erase recorded events/);
  assert.match(magnetic, /stale or unavailable readings are not a quiet field/);
  assert.match(magnetic, /bounded, downsampled history—not every measurement/);
  assert.match(magnetic, /saved graph shows past measurements; it does not resume collection/);
});

test('getting started and troubleshooting link directly to magnetic help without changing the article ID', async () => {
  for (const path of ['docs/zendesk-getting-started-article.html', 'docs/zendesk-troubleshooting-article.html']) {
    assert.ok((await text(path)).includes(`<a href="${articleURL}">Use the magnetic meter</a>`), path);
  }
  const troubleshooting = await text('docs/zendesk-troubleshooting-article.html');
  assert.match(troubleshooting, /<strong>Guide<\/strong>[\s\S]*<strong>Reading the magnetic meter<\/strong>[\s\S]*<strong>Practice with the magnetometer<\/strong>[\s\S]*<strong>Start Practice<\/strong>/);
  assert.match(magnetic, /href="https:\/\/arcsignal\.app\/guide\.html#magnetic"/);
});

test('promotion prioritizes core magnetic help without removing the Experimental Watch article', () => {
  for (const row of [
    '| Get started with Spectra | 56434299423899 | Getting started | Yes |',
    '| Troubleshoot missing devices and unexpected readings | 56434354083227 | Troubleshooting | Yes |',
    '| Contact Arc Signal support | 56435622772379 | Company overview | Yes |',
    '| Take a sweep with the Experimental Apple Watch companion | 56434359907227 | Experimental Apple Watch | No |',
  ]) assert.ok(inventory.includes(row), row);
  assert.match(inventory, /The Watch article[\s\S]*remains published, in its existing section/);
});

test('magnetic help uses one real app screenshot with explicit simulated-data disclosure and matching gallery provenance', async () => {
  assert.equal([...magnetic.matchAll(/<img\b/g)].length, 1);
  assert.match(magnetic, /<figcaption><strong>Example data · Actual app interface\.<\/strong>/);
  assert.match(magnetic, /illustrative readings are not evidence of nearby devices/);
  assert.match(magnetic, /alt="[^"]*Actual field, Delta from reference[^\"]*simulated example readings/);
  assert.match(magnetic, /width="440" height="956" style="height: auto; max-width: 100%;"/);
  const provenance = JSON.parse(await text('assets/data/spectra-screenshots.json'));
  const screenshot = provenance.items.find(item => item.id === '03-magnetic-sweep');
  assert.ok(screenshot);
  assert.equal(provenance.exampleData, true);
  assert.ok(magnetic.includes(`src="https://arcsignal.app/${screenshot.output}?v=${screenshot.outputSHA256.slice(0, 12)}"`));
  assert.equal(screenshot.width, 1320);
  assert.equal(screenshot.height, 2868);
});
