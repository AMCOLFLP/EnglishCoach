import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, cpSync, mkdirSync, writeFileSync, appendFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { MessageChannel } from 'node:worker_threads';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workerSource = readFileSync(join(root, 'sw.js'), 'utf8');
const deviceSource = readFileSync(join(root, 'assets/device.js'), 'utf8');

function memoryCaches() {
  const tables = new Map();
  const keyOf = value => typeof value === 'string' ? value : value.url;
  return {
    tables,
    async has(name) { return tables.has(name); },
    async keys() { return [...tables.keys()]; },
    async delete(name) { return tables.delete(name); },
    async open(name) {
      if (!tables.has(name)) tables.set(name, new Map());
      const table = tables.get(name);
      return {
        async match(key) { return table.get(keyOf(key))?.clone(); },
        async put(key, value) { table.set(keyOf(key), value.clone()); },
      };
    },
  };
}

function serviceWorker({ scope = 'https://school.example/coach/', caches = memoryCaches(), version } = {}) {
  const handlers = new Map(), calls = [];
  let skipped = 0, claimed = 0;
  let network = async request => {
    const path = new URL(request.url).pathname.slice(new URL(scope).pathname.length);
    return new Response(readFileSync(join(root, path)), { status: 200 });
  };
  const self = {
    registration: { scope },
    clients: { async claim() { claimed += 1; } },
    async skipWaiting() { skipped += 1; },
    addEventListener(type, callback) { handlers.set(type, callback); },
  };
  const source = version ? workerSource.replace(/^const CACHE_VERSION = '[^']+';/m, `const CACHE_VERSION = '${version}';`) : workerSource;
  runInNewContext(source, { self, caches, URL, Request, Response,
    fetch: async request => { calls.push(request); return network(request); } });
  async function lifecycle(type, values = {}) {
    const pending = [];
    handlers.get(type)({ ...values, waitUntil(promise) { pending.push(promise); } });
    await Promise.all(pending);
  }
  return {
    caches, calls, scope,
    get skipped() { return skipped; }, get claimed() { return claimed; },
    setNetwork(callback) { network = callback; },
    lifecycle,
    async message(type, sourceURL = scope) {
      const replies = [];
      await lifecycle('message', { data: { type }, source: { url: sourceURL },
        ports: [{ postMessage(value) { replies.push(value); } }] });
      return replies[0];
    },
    async fetch(url, options = {}) {
      const request = { url, method: options.method || 'GET', mode: options.mode || 'cors', headers: new Headers(options.headers) };
      let response;
      handlers.get('fetch')({ request, respondWith(value) { response = Promise.resolve(value); } });
      return { handled: Boolean(response), response: response ? await response : null };
    },
  };
}

test('offline readiness requires the complete shell, and cached navigation and assets work without a network', async () => {
  const sw = serviceWorker();
  assert.equal((await sw.message('COACH_GET_CACHE_STATUS')).offlineReady, false);
  await sw.lifecycle('install');
  assert.equal((await sw.message('COACH_GET_CACHE_STATUS')).offlineReady, true);
  const downloaded = new Set(sw.calls.map(request => request.url));
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)=["'](\.\/(?:assets\/[^"'?#]+|manifest\.webmanifest))["']/g)].map(match => match[1]);
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const reference of [...references, ...manifest.icons.map(icon => icon.src), './assets/storage.js', './assets/device.js']) {
    assert.equal(downloaded.has(new URL(reference, sw.scope).href), true, `${reference} must be available offline`);
  }
  assert.equal(sw.calls.every(request => request.credentials === 'omit' && request.redirect === 'error'), true);
  sw.setNetwork(async () => { throw new TypeError('Offline'); });
  for (const url of [sw.scope, `${sw.scope}index.html`, `${sw.scope}#/lessons/introductions`]) {
    const result = await sw.fetch(url, { mode: 'navigate' });
    assert.equal(result.handled, true);
    assert.equal(result.response.status, 200);
    assert.equal(await result.response.text(), html);
  }
  const storedScript = await sw.fetch(`${sw.scope}assets/storage.js`);
  assert.equal(storedScript.response.status, 200);
  assert.equal(await storedScript.response.text(), readFileSync(join(root, 'assets/storage.js'), 'utf8'));
});

test('a missing required download fails installation instead of announcing an incomplete offline copy', async () => {
  const sw = serviceWorker();
  sw.setNetwork(async request => new Response('fixture', { status: request.url.endsWith('/assets/storage.js') ? 404 : 200 }));
  await assert.rejects(sw.lifecycle('install'), /download failed/);
  assert.equal((await sw.message('COACH_GET_CACHE_STATUS')).offlineReady, false);
  assert.deepEqual(await sw.caches.keys(), []);
  assert.equal(sw.skipped, 0);
});

test('scope-specific activation removes only its own outdated shell caches', async () => {
  const caches = memoryCaches();
  const old = serviceWorker({ scope: 'https://school.example/one/', caches, version: 'v1.0.0' });
  const other = serviceWorker({ scope: 'https://school.example/two/', caches });
  await old.lifecycle('install');
  const oldNames = await caches.keys();
  await other.lifecycle('install');
  const otherName = (await caches.keys()).find(name => !oldNames.includes(name));
  await caches.open('another-application-cache');
  const current = serviceWorker({ scope: old.scope, caches });
  await current.lifecycle('install');
  await current.lifecycle('activate');
  const remaining = await caches.keys();
  assert.equal(oldNames.some(name => remaining.includes(name)), false);
  assert.equal(remaining.includes(otherName), true);
  assert.equal(remaining.includes('another-application-cache'), true);
  assert.equal((await current.message('COACH_GET_CACHE_STATUS')).offlineReady, true);
  assert.equal((await other.message('COACH_GET_CACHE_STATUS')).offlineReady, true);
  assert.equal(current.claimed, 1);
});

test('API, authorization, query tokens, cross-origin, outside-scope and non-GET traffic bypasses the offline handler', async () => {
  const sw = serviceWorker();
  await sw.lifecycle('install');
  const before = sw.calls.length;
  const cases = [
    [`${sw.scope}coach`, {}], [`${sw.scope}api/feedback`, { mode: 'navigate' }],
    [`${sw.scope}assets/app.js`, { method: 'POST' }],
    [`${sw.scope}assets/app.js`, { headers: { Authorization: 'Bearer artificial-test-token' } }],
    [`${sw.scope}assets/app.js`, { headers: { 'X-API-Key': 'artificial-test-key' } }],
    [`${sw.scope}assets/app.js?access_token=fixture`, {}],
    ['https://api.example/coach', {}], ['https://school.example/other/index.html', { mode: 'navigate' }],
  ];
  for (const [url, options] of cases) assert.equal((await sw.fetch(url, options)).handled, false, url);
  assert.equal(sw.calls.length, before);
  for (const table of sw.caches.tables.values()) assert.equal([...table.keys()].some(url => /token|\/coach$|\/api\//.test(url)), false);
});

test('a new worker waits until an explicit message from its own scope requests activation', async () => {
  const sw = serviceWorker();
  await sw.lifecycle('install');
  assert.equal(sw.skipped, 0);
  await sw.message('COACH_SKIP_WAITING', 'https://school.example/another-app/');
  assert.equal(sw.skipped, 0);
  await sw.message('UNRELATED_MESSAGE');
  assert.equal(sw.skipped, 0);
  await sw.message('COACH_SKIP_WAITING');
  assert.equal(sw.skipped, 1);
});

test('uncached offline navigation returns an explanatory unavailable response instead of an empty successful page', async () => {
  const sw = serviceWorker();
  sw.setNetwork(async () => { throw new TypeError('Offline'); });
  const result = await sw.fetch(sw.scope, { mode: 'navigate' });
  assert.equal(result.response.status, 503);
  assert.match(await result.response.text(), /Reconnect/);
  assert.equal((await sw.message('COACH_GET_CACHE_STATUS')).offlineReady, false);
});

class DetailEvent extends Event {
  constructor(type, options = {}) { super(type, options); this.detail = options.detail; }
}
function device({ file = false, standaloneFile = false, secure = true, active = true, waiting = false } = {}) {
  const w = new EventTarget();
  const service = new EventTarget();
  const media = new EventTarget(); media.matches = false;
  const scope = 'https://school.example/coach/';
  const calls = { register: 0, persist: 0, prompts: 0, reload: 0, waitingMessages: [] };
  let cacheReady = false;
  const activeWorker = new EventTarget();
  activeWorker.state = 'activated'; activeWorker.scriptURL = `${scope}sw.js`;
  activeWorker.postMessage = (message, ports) => {
    if (message.type === 'COACH_GET_CACHE_STATUS') ports[0].postMessage({ type: 'COACH_CACHE_STATUS', offlineReady: cacheReady, offlineError: null });
  };
  const registration = new EventTarget();
  registration.scope = scope; registration.active = active ? activeWorker : null;
  registration.installing = null;
  registration.waiting = waiting ? Object.assign(new EventTarget(), { state: 'installed', postMessage(value) { calls.waitingMessages.push(value); } }) : null;
  registration.update = async () => {};
  service.register = async (...args) => { calls.register += 1; calls.registrationArgs = args; return registration; };
  service.getRegistration = async () => registration;
  w.location = { protocol: file ? 'file:' : 'https:', reload() { calls.reload += 1; } };
  w.isSecureContext = secure; w.COACH_STANDALONE = standaloneFile;
  w.navigator = { onLine: true, standalone: false, serviceWorker: service, storage: {
    persisted: async () => false,
    persist: async () => { calls.persist += 1; return true; },
  } };
  w.matchMedia = () => media;
  runInNewContext(deviceSource, { window: w, document: { baseURI: `${scope}index.html` },
    URL, CustomEvent: DetailEvent, MessageChannel, setTimeout, clearTimeout });
  return { w, calls, registration, api: w.CoachDevice, setReady(value) { cacheReady = value; } };
}

test('the standalone HTML, file URLs, and insecure contexts never register an offline worker', async () => {
  for (const options of [{ standaloneFile: true }, { file: true }, { secure: false }]) {
    const page = device(options);
    await page.api.init();
    await page.api.init();
    assert.equal(page.calls.register, 0);
    assert.equal(page.api.snapshot().offlineReady, false);
    assert.equal(await page.api.install(), false);
    assert.equal(page.api.applyUpdate(), false);
    assert.equal(await page.api.requestPersistence(), false);
    assert.equal(page.calls.persist, 0);
  }
});

test('device readiness follows complete-cache confirmation, not merely a registration, and emits copied state', async () => {
  const page = device();
  const changes = [];
  page.w.addEventListener('coach-device-change', event => changes.push(event.detail));
  await page.api.init();
  assert.equal(page.calls.register, 1);
  assert.equal(page.calls.registrationArgs[0], './sw.js');
  assert.equal(page.calls.registrationArgs[1].scope, './');
  assert.equal(page.calls.registrationArgs[1].updateViaCache, 'none');
  assert.equal(page.api.snapshot().offlineReady, false);
  page.setReady(true);
  await page.api.init();
  assert.equal(page.api.snapshot().offlineReady, true);
  assert.equal(changes.at(-1).offlineReady, true);
  const copy = page.api.snapshot(); copy.offlineReady = false;
  assert.equal(page.api.snapshot().offlineReady, true);
  assert.equal(page.calls.persist, 0);
});

test('persistent storage is requested only explicitly and denial or unavailable storage is handled', async () => {
  const page = device({ active: false });
  await page.api.init();
  assert.equal(page.calls.persist, 0);
  assert.equal(page.api.snapshot().persistent, false);
  assert.equal(await page.api.requestPersistence(), true);
  assert.equal(page.calls.persist, 1);
  assert.equal(page.api.snapshot().persistent, true);
  page.w.navigator.storage.persist = async () => false;
  assert.equal(await page.api.requestPersistence(), false);
  assert.equal(page.api.snapshot().persistent, false);
  page.w.navigator.storage.persist = async () => { throw new TypeError('Storage unavailable'); };
  assert.equal(await page.api.requestPersistence(), false);
  assert.equal(page.api.snapshot().persistent, null);
  delete page.w.navigator.storage.persist;
  assert.equal(await page.api.requestPersistence(), false);
  assert.equal(page.api.snapshot().persistenceSupported, false);
});

test('installation prompts and update-triggered reloads require explicit device actions', async () => {
  const page = device({ waiting: true });
  await page.api.init();
  assert.equal(await page.api.install(), false);
  const prompt = new Event('beforeinstallprompt', { cancelable: true });
  prompt.prompt = async () => { page.calls.prompts += 1; return { outcome: 'accepted' }; };
  page.w.dispatchEvent(prompt);
  assert.equal(prompt.defaultPrevented, true);
  assert.equal(page.calls.prompts, 0);
  assert.equal(page.api.snapshot().installAvailable, true);
  assert.equal(await page.api.install(), true);
  assert.equal(page.calls.prompts, 1);
  assert.equal(page.api.snapshot().installAvailable, false);
  page.w.dispatchEvent(new Event('appinstalled'));
  assert.equal(page.api.snapshot().installed, true);
  assert.equal(page.api.snapshot().updateAvailable, true);
  assert.equal(page.calls.waitingMessages.length, 0);
  assert.equal(page.calls.reload, 0);
  assert.equal(page.api.applyUpdate(), true);
  assert.equal(page.calls.waitingMessages[0].type, 'COACH_SKIP_WAITING');
  assert.equal(page.calls.reload, 0);
  page.w.navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(page.calls.reload, 1);
});

test('builds hash shell changes, preserve the dist directory, and produce a standalone file with PWA setup disabled', t => {
  const temporary = mkdtempSync(join(tmpdir(), 'english-coach-build-'));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  cpSync(join(root, 'assets'), join(temporary, 'assets'), { recursive: true });
  cpSync(join(root, 'scripts'), join(temporary, 'scripts'), { recursive: true });
  for (const name of ['index.html', 'sw.js', 'manifest.webmanifest']) cpSync(join(root, name), join(temporary, name));
  // Ensure the standalone test exercises removal even before the shell owner
  // has added the PWA links to index.html during a parallel implementation.
  const sourceIndex = readFileSync(join(temporary, 'index.html'), 'utf8');
  writeFileSync(join(temporary, 'index.html'), sourceIndex.replace('</head>',
    '<link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./assets/apple-touch-icon.png"></head>'));
  mkdirSync(join(temporary, 'server'));
  writeFileSync(join(temporary, 'server/private-fixture.txt'), 'artificial private file');
  const build = () => execFileSync(process.execPath, [join(temporary, 'scripts/build.mjs')], { stdio: 'pipe' });
  build();
  const out = join(temporary, 'dist');
  const inode = statSync(out).ino;
  const firstWorker = readFileSync(join(out, 'sw.js'), 'utf8');
  build();
  assert.equal(statSync(out).ino, inode);
  assert.equal(readFileSync(join(out, 'sw.js'), 'utf8'), firstWorker);
  appendFileSync(join(temporary, 'assets/styles.css'), '\n/* changed offline shell fixture */\n');
  build();
  assert.notEqual(readFileSync(join(out, 'sw.js'), 'utf8'), firstWorker);
  assert.equal(statSync(out).ino, inode);
  assert.equal(existsSync(join(out, 'manifest.webmanifest')), true);
  assert.equal(existsSync(join(out, 'assets/device.js')), true);
  assert.equal(existsSync(join(out, 'server')), false);
  execFileSync(process.execPath, [join(temporary, 'scripts/standalone.mjs')], { stdio: 'pipe' });
  const html = readFileSync(join(out, 'English_Speaking_Coach.html'), 'utf8');
  assert.doesNotMatch(html, /<link\b[^>]*rel=["'](?:manifest|apple-touch-icon)["']/i);
  assert.doesNotMatch(html, /<script\b[^>]*src=/i);
  assert.doesNotMatch(html, /href=["']\.\/assets\/styles\.css/);
  assert.ok(html.indexOf('window.COACH_STANDALONE = true') > 0);
  assert.ok(html.indexOf('window.COACH_STANDALONE = true') < html.indexOf('window.CoachContent'));
});
