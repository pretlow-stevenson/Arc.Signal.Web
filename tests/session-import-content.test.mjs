import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from '../scripts/site-files.mjs';
import { guidePlainText } from '../scripts/guide-inline.mjs';

const guide = JSON.parse(await readFile(join(root, 'assets/data/spectra-guide.json'), 'utf8'));
const articles = new Map(guide.articles.map(({ content }) => [content.id, content]));
const section = (articleID, sectionID) => {
  const article = articles.get(articleID);
  assert.ok(article, `Missing Guide article ${articleID}`);
  const value = [...article.sections, ...article.technicalSections].find(item => item.id === sectionID);
  assert.ok(value, `Missing Guide section ${articleID}.${sectionID}`);
  return guidePlainText(value.body);
};
const text = async path => (await readFile(join(root, path), 'utf8'))
  .replace(/<\/?(?:b|strong)\b[^>]*>/g, '');

test('saved-session overview preserves original scope and filter-independent signal counts', async () => {
  const overview = section('sessions', 'overview');
  for (const value of [overview, await text('docs/zendesk-session-article.html')]) {
    assert.match(value, /original capture time, duration, collector, and recorded measurements/);
    assert.match(value, /totals do not change when you filter results/);
    assert.match(value, /signal identities are not a count of physical devices/);
    assert.match(value, /Coverage warnings remain visible/);
    assert.match(value, /Scan breakdown/);
    assert.match(value, /Add notes/);
    assert.match(value, /saved notes are separate from sensor evidence/);
  }
});

test('imported-only survivors cannot retain a private local Bluetooth reference', async () => {
  const identity = section('privacy', 'identity');
  assert.match(identity, /last non-imported original or recheck copy/);
  assert.match(identity, /imported copies cannot keep it/);
  for (const path of ['spectra-privacy.html', 'docs/zendesk-session-article.html']) {
    const page = await text(path);
    assert.match(page, /last non-imported original or recheck copy/, path);
    assert.match(page, /imported copies cannot keep it/, path);
    assert.doesNotMatch(page, /Removing the last retained copy|no original or recheck copy from that capture remains/, path);
  }
});

test('import is previewed and explicitly confirmed, not an automatic fresh capture', async () => {
  const preview = section('sessions', 'import');
  for (const phrase of ['Import Session', 'select a file in Files', 'open a compatible file',
    'Review the original capture time', 'then choose Import Session to save',
    'Cancel leaves history unchanged', 'Analysis JSON', 'Reduced identifying information',
    'validation and saving run on device', 'separate from the original collector and capture date',
    'does not discard the open results']) assert.ok(preview.includes(phrase), phrase);
  const privacy = section('privacy', 'import');
  assert.match(privacy, /not a fresh measurement or authenticated capture/);
  assert.match(privacy, /names, notes, collector details, and any location remain claims/);
  assert.match(privacy, /Private Bluetooth follow-up references are never restored/);
  for (const path of ['spectra.html', 'spectra-privacy.html', 'docs/zendesk-session-article.html']) {
    const page = await text(path);
    assert.match(page, /Import Session/, path);
    assert.match(page, /Technical archive/, path);
    assert.match(page, /historical|not a fresh|not fresh|Imported records retain the file’s acquisition and interpretation context/, path);
    assert.doesNotMatch(page, /imports? (?:a |an |the )?(?:authenticated|verified) capture|restores? every (?:JSON|export)/i, path);
  }
});

test('checksum matches is byte integrity, while legacy absence differs from failure', async () => {
  const integrity = section('sessions', 'import-integrity');
  assert.match(integrity, /checks the archived bytes, not the author, collector, device identity, or truth/);
  assert.match(integrity, /Supported older archives can say Checksum unavailable/);
  assert.match(integrity, /different from a failed integrity check/);
  assert.match(integrity, /failed checksum, malformed archive, or unsupported format cannot be imported/);
  assert.match(integrity, /does not start analysis, scanning, a recheck, or a map/);
  assert.match(integrity, /does not change the source file/);
  const support = await text('docs/zendesk-troubleshooting-article.html');
  assert.match(support, /not Analysis JSON or Reduced identifying information/);
  assert.match(support, /failed checksum or malformed file is different from a supported older archive/);
  assert.match(support, /Canceling file selection is not an import failure/);
});

test('history slots, primary bytes and measured local files remain independent', async () => {
  const capacity = section('sessions', 'capacity');
  for (const phrase of ['500 sessions', '256 MiB', 'originals, rechecks, and imported copies',
    'free bytes do not provide another session slot', 'an available slot does not guarantee',
    'never removes another session', 'Exporting alone does not free history space',
    'On this iPhone', 'protected recovery, pending history files, and received Watch captures',
    'not total app storage or free device space']) assert.ok(capacity.includes(phrase), phrase);
  const privacy = await text('spectra-privacy.html');
  assert.match(privacy, /independent limits/);
  assert.match(privacy, /Saved sessions are not automatically removed to make room/);
  assert.match(privacy, /Protected recovery copies remain until deliberate erasure/);
  assert.match(privacy, /Creating another recovery copy does not automatically remove an earlier one/);
  assert.match(privacy, /device storage remains finite/);
  assert.match(privacy, /A failed save preserves previously committed sessions and their retained references/);
  assert.match(privacy, /does not silently remove valid references to make the new save fit/);
  assert.doesNotMatch(privacy, /references may be shed|references? (?:are|is) sacrificed before evidence/i);
  assert.doesNotMatch(privacy, /(?:oldest|saved) sessions (?:are|will be) automatically (?:removed|deleted|retired)|up to three (?:protected )?recovery copies/i);
});

test('session-size guidance qualifies comparison units, unknown values and separate copies', async () => {
  const size = section('sessions', 'session-size');
  const support = await text('docs/zendesk-session-article.html');
  for (const value of [size, support]) {
    for (const phrase of ['Estimated size', 'Each saved-session row includes',
      'KiB and MiB use binary units', 'Shared history information',
      'row estimates do not add up to the history total',
      'deletion may free a different amount', 'A recheck or imported copy has its own size',
      'An unavailable estimate is not shown']) assert.ok(value.includes(phrase), phrase);
  }
});

test('capacity recovery preserves an unsaved result without claiming it is saved', async () => {
  const saving = section('sessions', 'saving');
  for (const phrase of ['keep the results open', 'Export JSON', 'Retry Saving', 'Manage Sessions',
    'does not save or discard the open result', 'crash', 'lose it',
    'no continuous autosaved draft']) assert.ok(saving.includes(phrase), phrase);
  const support = await text('docs/zendesk-troubleshooting-article.html');
  assert.match(support, /Exporting or managing alone does not save the open result/);
  assert.match(support, /does not guarantee free device space or access to protected storage/);
  assert.match(support, /storage-access failure is not permission to overwrite history/);
});

test('genuine Watch-copy retirement is not automatic saved-session removal', async () => {
  const capacity = section('watch', 'capacity');
  for (const phrase of ['five capture copies', '4 MiB each', 'only copies confirmed received',
    'only inbox copies already processed into Sessions', 'Unsent or unprocessed evidence is not automatically discarded',
    'Saved Sessions are not automatically removed', 'unprocessed inbox copy remains',
    'independently of the Save completed sessions setting']) assert.ok(capacity.includes(phrase), phrase);
  const watch = await text('docs/zendesk-watch-article.html');
  assert.match(watch, /Only safely received Watch copies or processed iPhone inbox copies/);
  assert.match(watch, /Saved Sessions are not automatically removed/);
  assert.match(watch, /unprocessed inbox capture remains/);
});
