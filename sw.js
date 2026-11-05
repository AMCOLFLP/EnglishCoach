/* Offline shell only. Learner work stays in CoachStorage, never in this cache.
 * For raw GitHub branch deployments, bump CACHE_VERSION whenever a shell file
 * changes. scripts/build.mjs adds a content hash of every shipped file and this
 * worker to the dist version automatically. A waiting update is user-applied.
 */
const CACHE_VERSION = 'v2.0.0';
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `english-coach:${encodeURIComponent(SCOPE.pathname)}:`;
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const SHELL_PATHS = [
  'index.html', 'manifest.webmanifest',
  'assets/config.js', 'assets/content.js', 'assets/core.js', 'assets/storage.js',
  'assets/device.js', 'assets/app.js', 'assets/styles.css', 'assets/favicon.svg',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png',
];
const SHELL_URLS = SHELL_PATHS.map(path => new URL(path, SCOPE).href);
const SHELL_SET = new Set(SHELL_URLS);
const INDEX_URL = new URL('index.html', SCOPE).href;

async function completeCache() {
  if (!await caches.has(CACHE_NAME)) return false;
  const cache = await caches.open(CACHE_NAME);
  const entries = await Promise.all(SHELL_URLS.map(url => cache.match(url)));
  return entries.every(Boolean);
}

async function prepareShell() {
  if (await completeCache()) return;
  // Fetch all public files before writing any of them. Refuse redirects and
  // authenticated fetches: a login page is not an offline application shell.
  const responses = await Promise.all(SHELL_URLS.map(async url => {
    const response = await fetch(new Request(url, { cache: 'reload', credentials: 'omit', redirect: 'error' }));
    if (response.status !== 200 || response.type === 'opaque' || response.redirected ||
        (response.url && new URL(response.url).origin !== SCOPE.origin)) {
      throw new Error('Offline shell download failed.');
    }
    return response;
  }));
  try {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(SHELL_URLS.map((url, i) => cache.put(url, responses[i])));
    if (!await completeCache()) throw new Error('Offline shell is incomplete.');
  } catch (error) {
    await caches.delete(CACHE_NAME);
    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(prepareShell());
  // No skipWaiting here: the app flushes drafts before a user applies an update.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

function sameScopeClient(client) {
  if (!client || typeof client.url !== 'string') return false;
  try {
    const url = new URL(client.url);
    return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
  } catch { return false; }
}

self.addEventListener('message', event => {
  if (!sameScopeClient(event.source)) return;
  if (event.data?.type === 'COACH_SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  } else if (event.data?.type === 'COACH_GET_CACHE_STATUS' && event.ports?.[0]) {
    event.waitUntil((async () => {
      try {
        const offlineReady = await completeCache();
        event.ports[0].postMessage({ type: 'COACH_CACHE_STATUS', version: CACHE_VERSION, offlineReady,
          offlineError: offlineReady ? null : 'The complete offline copy is not available yet.' });
      } catch {
        event.ports[0].postMessage({ type: 'COACH_CACHE_STATUS', offlineReady: false,
          offlineError: 'This browser could not verify its offline copy.' });
      }
    })());
  }
});

async function shellResponse(request, cacheKey, navigation) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const saved = await cache.match(cacheKey);
    if (saved) return saved;
  } catch { /* Network remains usable if Cache Storage is unavailable. */ }
  try { return await fetch(request); } catch (error) {
    if (!navigation) throw error;
    return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reconnect to open your coach</title><body><h1>Reconnect to open your coach</h1><p>The offline copy is unavailable. Connect to the internet and reload this page. Saved progress remains separate from the app cache.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Strict allowlist: no API, POST, cross-origin, query-token, or authenticated
  // requests ever enter Cache Storage or receive a cached substitute.
  if (request.method !== 'GET' || url.origin !== SCOPE.origin || url.search ||
      ['authorization', 'x-api-key', 'x-access-token', 'x-auth-token'].some(name => request.headers.has(name))) return;
  url.hash = '';
  const navigation = request.mode === 'navigate';
  const baseNavigation = navigation && (url.href === SCOPE.href || url.href === INDEX_URL);
  if (!baseNavigation && !SHELL_SET.has(url.href)) return;
  // Hash routes all request the same base document. Keep one coherent shell
  // version until the waiting worker activates; do not mix a new HTML shell
  // with old cached scripts or overwrite the cache with personalized responses.
  event.respondWith(shellResponse(request, baseNavigation ? INDEX_URL : url.href, navigation));
});
