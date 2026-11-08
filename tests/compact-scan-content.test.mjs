import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root} from '../scripts/site-files.mjs';
const text=file=>readFile(join(root,file),'utf8');
const guide=JSON.parse(await text('assets/data/spectra-guide.json'));
const setup=guide.articles.find(x=>x.content.id==='setup').content;

test('candidate Guide describes the Compact-only grouping without changing measurement access',async()=>{
  const compact=setup.sections.find(x=>x.id==='compact-scan').body;
  for(const phrase of ['**Settings** → **Preferences**','**Compact Scan view**','**General signal checks**',
    'groups Quick Check, Area Sweep and Monitor above **Focused Bluetooth checks**',
    'off by default','same checks, measurement choices and access requirements',
    'across launches','**Reset Spectra**','**Which check should I use?**','travel guidance remains']){
    assert.ok(compact.includes(phrase),phrase);
  }
  const support=await text('help/getting-started.html');
  assert.match(support,/1\.3\.0 candidate Guide/);
  assert.match(support,/public App Store version is 1\.2\.0/);
  assert.match(support,/General signal checks/);
  const publication=JSON.parse(await text('content/guide-publication.json'));
  const review=JSON.parse(await text('docs/screenshot-content-review.json'));
  assert.deepEqual(publication.holds,{appReviewSubmission:true,appStoreScreenshotUploads:true});
  assert.equal(publication.documentationVersion,guide.appVersion);
  assert.equal(publication.documentationBuild,guide.build);
  assert.equal(review.sourceEquivalence.candidateSourceCommit,publication.nativeSourceCommit);
  assert.match(publication.nativeSourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(review.sourceEquivalence.unchangedRuntimeInputCount,527);
  assert.equal(review.sourceEquivalence.freshCapturesAttributedTo1100,0);
});

test('the short mode comparison remains complete without empty reference blocks',async()=>{
  const comparison=guide.articles.find(x=>x.content.id==='choosingCheck').content;
  assert.deepEqual(comparison.sections.map(x=>x.id),['quick-check','area-sweep','monitor','focused-checks']);
  assert.equal(comparison.steps.length,0);assert.equal(comparison.technicalSections.length,0);
  const article=(await text('guide.html')).split('<article id="choosingCheck" class="guide-topic">')[1].split('</article>')[0];
  assert.match(article,/when Bluetooth is selected/);assert.match(article,/no background alerts/);
  assert.doesNotMatch(article,/What to try|Technical detail|<ol>/);
});

test('icon guidance and reset copy preserve confirmed-selection and default semantics',async()=>{
  const icons=setup.sections.find(x=>x.id==='app-icon').body;
  for(const phrase of ['**Satin Monochrome** (the default)','**Classic** (the original flat icon)',
    '27 choices','checkmark identifies the icon confirmed by iOS',
    'confirmed icon also appears on Spectra’s privacy cover'])assert.ok(icons.includes(phrase),phrase);
  const policy=await text('spectra-privacy.html');
  assert.match(policy,/restore the default app icon/);
  assert.doesNotMatch(policy,/restore the <b class="ui-label">Classic<\/b> app icon/);
});
