import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const code = await readFile(new URL('../assets/js/site-motion.js', import.meta.url), 'utf8');
function setup({ reduced = false, observerAvailable = true, loaded = true, hash = '', focused = false } = {}) {
  const classes = new Set();
  const listeners = {};
  const image = { complete: loaded, addEventListener: (name, callback) => { listeners[name] = callback; } };
  const target = {
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    matches: () => focused, querySelector: () => image,
    addEventListener: (name, callback) => { listeners[name] = callback; }
  };
  const state = { observed: false, disconnected: false };
  const preference = { matches: reduced, addEventListener: (_, callback) => { state.change = callback; } };
  class Observer {
    constructor(callback) { state.intersect = callback; }
    observe(element) { assert.equal(element, target); state.observed = true; }
    unobserve() { state.observed = false; }
    disconnect() { state.disconnected = true; }
  }
  runInNewContext(code, {
    window: { matchMedia: () => preference, ...(observerAvailable ? { IntersectionObserver: Observer } : {}) },
    IntersectionObserver: Observer,
    document: { querySelectorAll: () => [target] }, location: { hash }
  });
  return { state, target, classes, listeners, preference };
}

test('motion never hides resting content and waits for images before one reveal', () => {
  const view = setup({ loaded: false });
  assert.equal(view.classes.size, 0);
  assert.equal(view.state.observed, false);
  view.listeners.load();
  assert.equal(view.state.observed, true);
  view.state.intersect([{ target: view.target, isIntersecting: false }]);
  assert.equal(view.classes.size, 0);
  view.state.intersect([{ target: view.target, isIntersecting: true }]);
  assert.equal(view.state.observed, false);
  assert.ok(view.classes.has('is-revealing'));
  view.listeners.animationend();
  assert.equal(view.classes.size, 0);
});

test('reduced motion, missing observers, direct anchors and keyboard focus remain immediate', () => {
  for (const options of [{ reduced: true }, { observerAvailable: false }]) {
    const view = setup(options);
    assert.equal(view.classes.size, 0);
    assert.equal(view.state.observed, false);
  }
  for (const options of [{ hash: '#screens' }, { focused: true }]) {
    const view = setup(options);
    view.state.intersect([{ target: view.target, isIntersecting: true }]);
    assert.equal(view.classes.size, 0);
  }
});

test('enabling reduced motion stops effects and does not arm a late-loading image', () => {
  const view = setup({ loaded: false });
  view.preference.matches = true;
  view.state.change();
  view.listeners.load();
  assert.equal(view.state.disconnected, true);
  assert.equal(view.state.observed, false);
  assert.equal(view.classes.size, 0);
});
