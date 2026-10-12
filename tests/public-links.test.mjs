import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicReference } from '../scripts/site-files.mjs';

const files = ['index.html', 'support.html', 'guide.html', 'help/contact.html', 'help/sessions.html',
  'assets/images/spectra-area-sweep.webp', 'assets/css/site.css'];
const ids = new Map([['index.html', ['main']], ['support.html', ['main', 'contact']],
  ['guide.html', ['main', 'privacy']], ['help/contact.html', ['main', 'include-essentials']],
  ['help/sessions.html', ['main', 'exports']]]);

test('first-party links resolve at their real document depth, including absolute paths and encoded anchors', () => {
  for (const [value, expected] of [
    ['#include-essentials', 'help/contact.html'], ['./sessions.html#exports', 'help/sessions.html'],
    ['../support.html#contact', 'support.html'], ['../guide.html#privacy', 'guide.html'],
    ['/help/sessions.html#exports', 'help/sessions.html'],
    ['https://arcsignal.app/help/sessions.html#exports', 'help/sessions.html'],
    ['https://arcsignal.app/guide.html#%70rivacy', 'guide.html'],
    ['https://arcsignal.app', 'index.html'], ['/#main', 'index.html'],
    ['/assets/images/spectra-area-sweep.webp?v=64629dead2e2', 'assets/images/spectra-area-sweep.webp'],
  ]) assert.equal(resolvePublicReference('help/contact.html', value, files, ids), expected, value);
  assert.equal(resolvePublicReference('support.html', 'help/sessions.html#exports', files, ids), 'help/sessions.html');
});

test('hostname alone never proves a page, asset or fragment exists', () => {
  for (const value of ['https://arcsignal.app/missing.html', 'https://arcsignal.app/help/missing.html',
    'https://arcsignal.app/guide.html#missing', 'https://arcsignal.app/help/contact.html#missing',
    'https://arcsignal.app/assets/images/private-capture.png', '../missing.html', './missing.html',
    '../guide.html#missing', './sessions.html#missing', '/help/sessions.html#missing',
    'guide.html', './contact.html#', 'https://arcsignal.app/guide.html#']) {
    assert.throws(() => resolvePublicReference('help/contact.html', value, files, ids), /missing/, value);
  }
});

test('publication rejects destination tricks and unreviewed query parameters', () => {
  for (const value of ['', 'https://arcsignal.app.evil.example/guide.html',
    'https://arcsignal.app@evil.example/guide.html', 'https://user@arcsignal.app/guide.html',
    'http://arcsignal.app/guide.html', '//evil.example/guide.html', 'javascript:alert(1)',
    'data:text/html,test', 'mailto:other@example.com', '/guide.html?private-id=123',
    '/assets/css/site.css?v=64629dead2e2&amp;visitor=123', '/assets/css/site.css?v=short',
    '/guide.html#%ZZ', '/help%2fsessions.html', '\\evil.example/guide.html',
    '/guide.html&#35;privacy', '/guide.html#privacy\n']) {
    assert.throws(() => resolvePublicReference('help/contact.html', value, files, ids), undefined, value);
  }
});
