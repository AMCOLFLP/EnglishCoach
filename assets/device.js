(function () {
  'use strict';
  const w = window;
  const nav = w.navigator;
  let registration = null, deferredPrompt = null, initPromise = null;
  let started = false, reloadRequested = false, installedThisVisit = false, statusTicket = 0;
  const watchedWorkers = new WeakSet();
  const displayMode = typeof w.matchMedia === 'function' ? w.matchMedia('(display-mode: standalone)') : null;
  const isStandalone = () => Boolean(displayMode?.matches || nav.standalone === true);
  const canManageApp = () => !w.COACH_STANDALONE && /^https?:$/.test(w.location.protocol) && w.isSecureContext === true;
  const supportsPersistence = () => canManageApp() && typeof nav.storage?.persisted === 'function' && typeof nav.storage?.persist === 'function';
  const state = {
    online: nav.onLine !== false,
    secure: w.isSecureContext === true,
    standalone: isStandalone(),
    offlineReady: false,
    offlineError: null,
    updateAvailable: false,
    installAvailable: false,
    installed: isStandalone(),
    persistent: null,
    persistenceSupported: supportsPersistence(),
  };

  function snapshot() { return { ...state }; }
  function change(values = {}) {
    Object.assign(state, values);
    w.dispatchEvent(new CustomEvent('coach-device-change', { detail: snapshot() }));
  }
  function refreshEnvironment() {
    const standalone = isStandalone();
    change({ online: nav.onLine !== false, secure: w.isSecureContext === true, standalone,
      installed: installedThisVisit || standalone, persistenceSupported: supportsPersistence(),
      installAvailable: Boolean(deferredPrompt && canManageApp() && !standalone) });
  }
  async function readPersistence() {
    if (!supportsPersistence()) { change({ persistent: null, persistenceSupported: false }); return; }
    try { change({ persistent: (await nav.storage.persisted()) === true, persistenceSupported: true }); }
    catch { change({ persistent: null, persistenceSupported: true }); }
  }
  function workerStatus(worker) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer); channel.port1.close(); channel.port2.close();
        if (error) reject(error); else resolve(value);
      };
      const timer = setTimeout(() => finish(new Error('Offline status timed out.')), 5000);
      channel.port1.onmessage = event => {
        if (event.data?.type !== 'COACH_CACHE_STATUS' || typeof event.data.offlineReady !== 'boolean') return;
        finish(null, event.data);
      };
      channel.port1.onmessageerror = () => finish(new Error('Offline status unavailable.'));
      try { worker.postMessage({ type: 'COACH_GET_CACHE_STATUS' }, [channel.port2]); }
      catch (error) { finish(error); }
    });
  }
  async function refreshCacheStatus() {
    if (!canManageApp() || !registration) return;
    const ticket = ++statusTicket;
    change({ updateAvailable: Boolean(registration.waiting && registration.active) });
    const active = registration.active;
    if (!active || active.state !== 'activated') return;
    try {
      const result = await workerStatus(active);
      if (ticket !== statusTicket) return;
      change({ offlineReady: result.offlineReady,
        offlineError: result.offlineReady ? null : (typeof result.offlineError === 'string' ? result.offlineError : 'The offline copy is not ready yet.') });
    } catch {
      if (ticket === statusTicket) change({ offlineReady: false, offlineError: 'The browser could not confirm its offline copy. Reconnect and reload to try again.' });
    }
  }
  function watchWorker(worker) {
    if (!worker || watchedWorkers.has(worker)) return;
    watchedWorkers.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant' && !registration?.active) {
        change({ offlineReady: false, offlineError: 'Offline setup did not finish. Reconnect and reload to try again.' });
      }
      void refreshCacheStatus();
    });
  }
  function attachRegistration(value) {
    registration = value;
    registration.addEventListener('updatefound', () => watchWorker(registration.installing));
    watchWorker(registration.installing); watchWorker(registration.waiting); watchWorker(registration.active);
  }
  async function init() {
    if (initPromise) return initPromise;
    if (started) {
      refreshEnvironment();
      await Promise.all([readPersistence(), refreshCacheStatus()]);
      return snapshot();
    }
    started = true;
    initPromise = (async () => {
      w.addEventListener('online', () => {
        refreshEnvironment();
        if (registration && canManageApp()) {
          void refreshCacheStatus();
          void registration.update().catch(() => {});
        }
      });
      w.addEventListener('offline', refreshEnvironment);
      if (displayMode?.addEventListener) displayMode.addEventListener('change', refreshEnvironment);
      w.addEventListener('appinstalled', () => {
        deferredPrompt = null; installedThisVisit = true;
        refreshEnvironment();
      });
      w.addEventListener('beforeinstallprompt', event => {
        if (!canManageApp() || isStandalone()) return;
        event.preventDefault(); deferredPrompt = event; refreshEnvironment();
      });
      refreshEnvironment();
      // The standalone HTML is already self-contained. It must never register
      // or update a website worker, even if someone serves that file over HTTPS.
      if (!canManageApp()) {
        if (!w.COACH_STANDALONE && w.location.protocol !== 'file:') {
          change({ offlineError: 'Open the HTTPS website to prepare an offline copy.' });
        }
        return snapshot();
      }
      await readPersistence();
      if (!nav.serviceWorker) {
        change({ offlineError: 'This browser does not support offline website caching.' });
        return snapshot();
      }
      nav.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadRequested) {
          reloadRequested = false;
          w.location.reload();
          return;
        }
        void refreshCacheStatus();
      });
      try {
        attachRegistration(await nav.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }));
      } catch {
        // A previously installed site can still open offline when update checks
        // fail. Verify its existing cache instead of equating registration with readiness.
        let existing;
        try { existing = await nav.serviceWorker.getRegistration('./'); } catch { /* unavailable */ }
        const ownScope = new URL('./', document.baseURI).href;
        const ownScript = new URL('./sw.js', document.baseURI).href;
        if (existing?.scope === ownScope && existing.active?.scriptURL === ownScript) attachRegistration(existing);
        else {
          change({ offlineError: 'Offline setup is unavailable. Connect to the internet and reload to try again.' });
          return snapshot();
        }
      }
      await refreshCacheStatus();
      return snapshot();
    })();
    try { return await initPromise; } finally { initPromise = null; }
  }

  async function requestPersistence() {
    if (!supportsPersistence()) { change({ persistent: null, persistenceSupported: false }); return false; }
    try {
      // Only this explicit user action calls persist(); init merely reads persisted().
      const granted = (await nav.storage.persist()) === true;
      change({ persistent: granted, persistenceSupported: true });
      return granted;
    } catch { change({ persistent: null }); return false; }
  }
  async function install() {
    if (!canManageApp() || !deferredPrompt || isStandalone()) return false;
    const prompt = deferredPrompt;
    deferredPrompt = null; change({ installAvailable: false });
    try {
      const result = await prompt.prompt();
      const choice = prompt.userChoice ? await prompt.userChoice : result;
      return choice?.outcome === 'accepted';
    } catch { return false; }
  }
  function applyUpdate() {
    if (!canManageApp() || !registration?.waiting || !registration.active) return false;
    // The caller must flush drafts before invoking this user-triggered action.
    reloadRequested = true;
    try {
      registration.waiting.postMessage({ type: 'COACH_SKIP_WAITING' });
      return true;
    } catch { reloadRequested = false; return false; }
  }

  w.CoachDevice = Object.freeze({ init, snapshot, requestPersistence, install, applyUpdate });
})();
