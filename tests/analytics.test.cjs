const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(readFileSync('app/analytics/client.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function setup(hostname = 'ramonjm.com', id = 'G-TEST123') {
  const storage = new Map(); const scripts = []; let reloads = 0;
  const window = { location: { reload() { reloads++; } }, dispatchEvent() {} };
  const context = { exports: {}, require: () => ({ useSyncExternalStore() {} }), window,
    location: { hostname, origin: `https://${hostname}`, search: '?code=secret', hash: '#private' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    document: { createElement: () => ({}), head: { appendChild: script => scripts.push(script) } },
    process: { env: { NEXT_PUBLIC_GA_MEASUREMENT_ID: id } }, Event: class {} };
  vm.runInNewContext(compiled, context);
  return { api: context.exports, window, scripts, reloads: () => reloads };
}
test('no tag or events before consent, or after declining', () => {
  const t = setup(); t.api.track('page_view', '/');
  t.api.saveConsent('declined'); t.api.track('private_case_study_view', '/shakepay');
  assert.equal(t.scripts.length, 0); assert.equal(t.window.dataLayer, undefined);
});
test('accepted tracking initializes once and excludes sensitive URL data', () => {
  const t = setup(); t.api.saveConsent('accepted');
  t.api.track('page_view', '/tracer'); t.api.track('private_case_study_view', '/shakepay');
  assert.equal(t.scripts.length, 1);
  const commands = t.window.dataLayer.map(args => Array.from(args));
  const events = commands.filter(args => args[0] === 'event');
  assert.equal(events.length, 2);
  assert.equal(events[1][1], 'private_case_study_view');
  assert.equal(events[1][2].page_location, 'https://ramonjm.com/shakepay');
  assert.equal(events[1][2].access_state, 'authorized');
  assert.equal(commands.find(args => args[0] === 'config')[2].send_page_view, false);
  assert.ok(!JSON.stringify(commands).includes('secret'));
});
test('previews and missing ID never load Google', () => {
  for (const t of [setup('localhost'), setup('preview.vercel.app'), setup('ramonjm.com', '')]) {
    t.api.saveConsent('accepted'); t.api.track('page_view', '/'); assert.equal(t.scripts.length, 0);
  }
});
test('withdrawal updates consent and reloads to remove active tag', () => {
  const t = setup(); t.api.saveConsent('accepted'); t.api.track('page_view', '/');
  t.api.saveConsent('declined');
  assert.equal(t.reloads(), 1);
  assert.equal(Array.from(t.window.dataLayer.at(-1))[2].analytics_storage, 'denied');
  const count = t.window.dataLayer.length; t.api.track('page_view', '/tracer');
  assert.equal(t.window.dataLayer.length, count);
});
