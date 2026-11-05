/* English Speaking Coach — browser-local profiles with guarded writes and recovery. */
(function () {
  'use strict';

  const KEY = 'english-coach.device.v2';
  const BACKUP_KEY = KEY + '.backup';
  const LEGACY_KEY = 'english-coach.v1';
  const MAX_PROFILES = 8;
  const MAX_DRAFTS = 32;
  const MAX_DRAFT_LENGTH = 4000;
  const MAX_JSON_LENGTH = 32000000;
  const DRAFT_KEY = /^(?:practice|pronunciation)(?::[A-Za-z0-9_-]{1,100})?$/;
  const ROUTE = /^#\/(?:(?:home|lessons|practice|conversation|pronunciation|dashboard|quiz|leaderboard|about|contact)(?:\/[A-Za-z0-9_-]{1,100})?)?$/;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const copy = value => JSON.parse(JSON.stringify(value));
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.prototype.toString.call(value) === '[object Object]';
  const validID = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  const text = (value, limit) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, limit);

  function issue(code, available = true) {
    const error = new Error(code);
    error.code = code;
    error.available = available;
    return error;
  }

  function storageIssue(error, writing = false) {
    if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || error?.code === 22 || error?.code === 1014) return issue('quota-exceeded');
    if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError') {
      return issue('storage-unavailable', false);
    }
    return issue(writing ? 'write-failed' : 'read-failed', !writing ? false : true);
  }

  function timestamp(value) {
    if (typeof value !== 'string'
        || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== value.slice(0, 19)) return null;
    return date.toISOString();
  }

  function preference(key, value) {
    if (key === 'showThaiGuide' && typeof value === 'boolean') return value;
    if (key === 'lastRoute' && typeof value === 'string' && value.length <= 130 && ROUTE.test(value)) return value;
    return undefined;
  }

  /**
   * A store owns one namespace on this origin. load() is cached; reload() is an
   * explicit discard-and-reread operation. All returned records are snapshots.
   *
   * Drafts and preferences belong to the active learner. Drafts accept only
   * practice[:id] / pronunciation[:id], at most 32 texts of 4,000 characters.
   * Preferences accept only showThaiGuide:boolean and lastRoute:internal hash.
   * No endpoint, access code, provider token, or conversation-history field exists.
   *
   * Status: ok means the current work is durable; savedAt is the last known
   * durable vault timestamp, even on failure. recovered reports backup recovery.
   * Failed writes retain memory changes. Corrupt data without a good backup is
   * never overwritten by ordinary methods. reset() explicitly replaces this
   * namespace's entire vault and backup, while preserving the original legacy key.
   * Confirmed delete/reset/replace and draft clears also purge the recovery copy,
   * so recovery cannot resurrect removed data after a successful operation. The
   * untouched v1 migration source is intentionally retained outside this vault.
   *
   * Before a write, unrelated profiles are merged from storage; same-profile
   * conflicts fail. localStorage has no compare-and-swap: this guard detects
   * observed changes, but cannot make simultaneous multi-tab writes transactional.
   */
  function create(options = {}) {
    const core = globalThis.CoachCore || (typeof window !== 'undefined' && window.CoachCore);
    if (!core?.newState || !core?.normalizeState) throw new TypeError('Load CoachCore before CoachStorage.');
    const namespace = typeof options.namespace === 'string' ? options.namespace.slice(0, 200) : '';
    const mainKey = KEY + (namespace ? ':' + encodeURIComponent(namespace) : '');
    const keys = Object.freeze({ main: mainKey, backup: namespace ? mainKey + '.backup' : BACKUP_KEY, legacy: LEGACY_KEY });
    const clock = typeof options.now === 'function' ? options.now : () => new Date();
    let serial = 0;
    let initialized = false, vault, baseline, durable = false, initialReadComplete = false;
    let savedAt = null, recovered = false, migrated = false, blocked = null, destructivePending = false;
    let status = { ok: false, available: false, error: 'storage-unavailable', savedAt: null, recovered: false };

    function now() {
      try {
        const date = new Date(clock());
        if (Number.isFinite(date.getTime())) return date.toISOString();
      } catch { /* A faulty optional clock must not prevent a local save. */ }
      return new Date().toISOString();
    }

    function nextID(existing = []) {
      const used = new Set(existing.map(profile => profile.id));
      for (let attempt = 0; attempt < 8; attempt++) {
        let id;
        try { id = options.makeID?.() || globalThis.crypto?.randomUUID?.(); } catch { /* Use the local fallback. */ }
        if (!validID(id)) id = `learner-${Date.now().toString(36)}-${++serial}-${Math.random().toString(36).slice(2, 10)}`;
        if (!used.has(id)) return id;
      }
      let id;
      do { id = `learner-${Date.now().toString(36)}-${++serial}`; } while (used.has(id));
      return id;
    }

    function adapter() {
      let storage;
      try { storage = own(options, 'storage') ? options.storage : globalThis.localStorage; }
      catch (error) { throw storageIssue(error); }
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
        throw issue('storage-unavailable', false);
      }
      return storage;
    }

    function read(key) {
      const storage = adapter();
      let raw;
      try { raw = storage.getItem(key); } catch (error) { throw storageIssue(error); }
      if (raw === null || raw === undefined) return null;
      if (typeof raw !== 'string') throw issue('corrupt-data');
      return raw;
    }

    function write(key, value) {
      const storage = adapter();
      try { storage.setItem(key, value); } catch (error) { throw storageIssue(error, true); }
    }

    function result(ok, error = null, available = true) {
      status = { ok, available, error, savedAt, recovered };
      return { ...status };
    }

    function failed(error) {
      const known = typeof error?.code === 'string';
      return result(false, known ? error.code : 'write-failed', known ? error.available !== false : true);
    }

    function makeProfile(state, existing = []) {
      return { id: nextID(existing), state: core.normalizeState(state), updatedAt: now(), revision: 0,
        drafts: {}, preferences: {} };
    }

    function makeVault(state) {
      const profile = makeProfile(state);
      return { version: 2, activeProfileId: profile.id, updatedAt: profile.updatedAt, profiles: [profile] };
    }

    function normalizeVault(raw) {
      if (!record(raw)) throw issue('corrupt-data');
      if (raw.version !== 2) throw issue(raw.version > 2 ? 'unsupported-version' : 'corrupt-data');
      if (!Array.isArray(raw.profiles) || !raw.profiles.length || raw.profiles.length > MAX_PROFILES
          || !timestamp(raw.updatedAt)) throw issue('corrupt-data');
      const ids = new Set();
      const profiles = raw.profiles.map(item => {
        if (!record(item) || !validID(item.id) || ids.has(item.id) || !timestamp(item.updatedAt)
            || !record(item.state) || item.state.version !== 1 || !record(item.state.profile)
            || !Array.isArray(item.state.sessions) || !Array.isArray(item.state.completedLessons)
            || typeof item.state.notes !== 'string'
            || (item.revision !== undefined && (!Number.isSafeInteger(item.revision) || item.revision < 0))) {
          throw issue('corrupt-data');
        }
        ids.add(item.id);
        let state;
        try { state = core.normalizeState(item.state); } catch { throw issue('corrupt-data'); }
        const drafts = {};
        for (const [key, value] of Object.entries(record(item.drafts) ? item.drafts : {})) {
          if (DRAFT_KEY.test(key) && typeof value === 'string' && Object.keys(drafts).length < MAX_DRAFTS) {
            const cleaned = text(value, MAX_DRAFT_LENGTH);
            if (cleaned) drafts[key] = cleaned;
          }
        }
        const preferences = {};
        for (const key of ['showThaiGuide', 'lastRoute']) {
          const value = preference(key, record(item.preferences) ? item.preferences[key] : undefined);
          if (value !== undefined) preferences[key] = value;
        }
        return { id: item.id, state, updatedAt: timestamp(item.updatedAt), revision: item.revision || 0,
          drafts, preferences };
      });
      if (!ids.has(raw.activeProfileId)) throw issue('corrupt-data');
      return { version: 2, activeProfileId: raw.activeProfileId, updatedAt: timestamp(raw.updatedAt), profiles };
    }

    function parse(raw) {
      if (raw.length > MAX_JSON_LENGTH) throw issue('corrupt-data');
      let value;
      try { value = JSON.parse(raw); } catch { throw issue('corrupt-data'); }
      return normalizeVault(value);
    }

    function readDisk() {
      const raw = read(keys.main);
      let mainError = null;
      if (raw !== null) {
        try { return { vault: parse(raw), backup: false }; }
        catch (error) {
          // An unknown newer schema must not be downgraded, even with an older backup.
          if (error.code === 'unsupported-version') throw error;
          mainError = error;
        }
      }
      const backup = read(keys.backup);
      if (backup !== null) {
        try { return { vault: parse(backup), backup: true }; }
        catch { throw issue('corrupt-data'); }
      }
      if (mainError) throw mainError;
      return null;
    }

    function readLegacy() {
      const raw = read(keys.legacy);
      if (raw === null) return null;
      if (raw.length > MAX_JSON_LENGTH) throw issue('corrupt-data');
      try { return core.normalizeState(JSON.parse(raw)); }
      catch { throw issue('corrupt-data'); }
    }

    const profileSignature = profile => profile ? JSON.stringify(profile) : null;

    function merge(remote, protectActive) {
      const previous = new Map(baseline.profiles.map(profile => [profile.id, profile]));
      const local = new Map(vault.profiles.map(profile => [profile.id, profile]));
      const incoming = new Map(remote.profiles.map(profile => [profile.id, profile]));
      const profiles = [];
      for (const id of new Set([...incoming.keys(), ...local.keys(), ...previous.keys()])) {
        const before = previous.get(id), here = local.get(id), there = incoming.get(id);
        const localChanged = profileSignature(here) !== profileSignature(before);
        const remoteChanged = profileSignature(there) !== profileSignature(before);
        if (remoteChanged && ((protectActive && id === vault.activeProfileId)
            || (localChanged && profileSignature(here) !== profileSignature(there)))) throw issue('conflict');
        const chosen = localChanged ? here : there;
        if (chosen) profiles.push(copy(chosen));
      }
      if (profiles.length > MAX_PROFILES) throw issue('profile-limit');
      if (!profiles.some(profile => profile.id === vault.activeProfileId)) throw issue('conflict');
      return { version: 2, activeProfileId: vault.activeProfileId, updatedAt: vault.updatedAt, profiles };
    }

    function persist(protectActive = true, destructive = false) {
      destructivePending = destructivePending || destructive;
      if (blocked) return failed(issue(blocked));
      try {
        const disk = readDisk();
        if (!initialReadComplete) {
          // A previously blocked read must never conceal legacy work when access returns.
          if (!disk && read(keys.legacy) !== null) throw issue('conflict');
          initialReadComplete = true;
        }
        if (disk) {
          if (disk.backup) recovered = true;
          const merged = merge(disk.vault, protectActive);
          vault = merged;
          baseline = copy(disk.vault);
          durable = true;
          savedAt = disk.vault.updatedAt;
        } else if (durable) {
          throw issue('conflict');
        }
        const candidate = copy(vault);
        candidate.updatedAt = now();
        // Backup first: if either write fails, the previous main remains readable.
        // A new vault seeds its recovery copy from its validated initial state.
        // Destructive intent survives failed writes and ordinary retries: a later
        // successful save must not restore removed data through the recovery copy.
        write(keys.backup, JSON.stringify(durable && !destructivePending ? baseline : candidate));
        write(keys.main, JSON.stringify(candidate));
        vault = candidate;
        baseline = copy(candidate);
        durable = true;
        savedAt = candidate.updatedAt;
        destructivePending = false;
        return result(true);
      } catch (error) {
        if (error.code === 'corrupt-data' || error.code === 'unsupported-version') blocked = error.code;
        return failed(error);
      }
    }

    function initialize() {
      if (initialized) return;
      initialized = true;
      recovered = false; migrated = false; blocked = null; durable = false; destructivePending = false;
      initialReadComplete = false; savedAt = null;
      try {
        const disk = readDisk();
        if (disk) {
          vault = disk.vault;
          baseline = copy(vault);
          durable = true; initialReadComplete = true;
          savedAt = vault.updatedAt; recovered = disk.backup;
          if (recovered) {
            // Keep the valid backup untouched while repairing its corrupt/missing main.
            try { write(keys.main, JSON.stringify(vault)); result(true); }
            catch (error) { failed(error); }
          } else result(true);
          return;
        }
        const legacy = readLegacy();
        initialReadComplete = true;
        migrated = legacy !== null;
        vault = makeVault(legacy || core.newState());
        baseline = copy(vault);
        persist(false);
      } catch (error) {
        vault = makeVault(core.newState());
        baseline = copy(vault);
        if (error.code === 'corrupt-data' || error.code === 'unsupported-version') blocked = error.code;
        failed(error);
      }
    }

    function active() { return vault.profiles.find(profile => profile.id === vault.activeProfileId); }
    function touch(profile) {
      profile.updatedAt = now();
      profile.revision = Math.min(Number.MAX_SAFE_INTEGER, profile.revision + 1);
    }
    function listProfiles() {
      initialize();
      return vault.profiles.map(profile => ({ id: profile.id, name: profile.state.profile.name,
        state: copy(profile.state), updatedAt: profile.updatedAt }));
    }
    function selected() {
      return { state: copy(active().state), activeProfileId: vault.activeProfileId, status: { ...status } };
    }
    function load() {
      initialize();
      return { ...selected(), profiles: listProfiles(), migrated };
    }
    function reload() { initialized = false; return load(); }

    function save(state) {
      initialize();
      let normalized;
      try { normalized = core.normalizeState(state); } catch { return failed(issue('invalid-state', status.available)); }
      const profile = active();
      if (JSON.stringify(profile.state) !== JSON.stringify(normalized)) {
        profile.state = normalized;
        touch(profile);
      }
      return persist();
    }

    function replaceProfile(state) {
      initialize();
      let normalized;
      try { normalized = core.normalizeState(state); }
      catch { failed(issue('invalid-state', status.available)); return selected(); }
      const profile = active();
      profile.state = normalized;
      profile.drafts = {};
      profile.preferences = {};
      touch(profile);
      persist(true, true);
      return selected();
    }

    function resetProfile() { return replaceProfile(core.newState()); }

    function createProfile(name) {
      initialize();
      if (vault.profiles.length >= MAX_PROFILES) { failed(issue('profile-limit', status.available)); return selected(); }
      const before = copy(vault);
      const state = core.newState();
      state.profile.name = typeof name === 'string' ? name : 'Learner';
      const profile = makeProfile(state, vault.profiles);
      vault.profiles.push(profile);
      vault.activeProfileId = profile.id;
      persist(false);
      // A concurrent creation may consume the final slot. Never change selection
      // or keep an inaccessible ninth learner when reporting a profile-limit error.
      if (status.error === 'profile-limit') vault = before;
      return selected();
    }

    function switchProfile(id) {
      initialize();
      if (!vault.profiles.some(profile => profile.id === id)) {
        failed(issue('profile-not-found', status.available)); return selected();
      }
      vault.activeProfileId = id;
      persist(false);
      return selected();
    }

    function deleteProfile(id) {
      initialize();
      if (!vault.profiles.some(profile => profile.id === id)) {
        failed(issue('profile-not-found', status.available)); return selected();
      }
      if (vault.profiles.length === 1) { failed(issue('last-profile', status.available)); return selected(); }
      vault.profiles = vault.profiles.filter(profile => profile.id !== id);
      if (vault.activeProfileId === id) vault.activeProfileId = vault.profiles[0].id;
      persist(false, true);
      return selected();
    }

    function getDraft(key) {
      initialize();
      return typeof key === 'string' && DRAFT_KEY.test(key) && own(active().drafts, key) ? active().drafts[key] : '';
    }
    function setDraft(key, value) {
      initialize();
      if (typeof key !== 'string' || !DRAFT_KEY.test(key) || typeof value !== 'string') {
        return failed(issue('invalid-draft', status.available));
      }
      const profile = active(), cleaned = text(value, MAX_DRAFT_LENGTH);
      if (cleaned && !own(profile.drafts, key) && Object.keys(profile.drafts).length >= MAX_DRAFTS) {
        return failed(issue('draft-limit', status.available));
      }
      if ((profile.drafts[key] || '') !== cleaned) {
        if (cleaned) profile.drafts[key] = cleaned;
        else delete profile.drafts[key];
        touch(profile);
      }
      return persist(true, cleaned === '');
    }
    function clearDraft(key) { return setDraft(key, ''); }
    function getPreference(key) {
      initialize();
      return (key === 'showThaiGuide' || key === 'lastRoute') && own(active().preferences, key)
        ? active().preferences[key] : undefined;
    }
    function setPreference(key, value) {
      initialize();
      const checked = preference(key, value);
      if (checked === undefined) return failed(issue('invalid-preference', status.available));
      const profile = active();
      if (profile.preferences[key] !== checked) { profile.preferences[key] = checked; touch(profile); }
      return persist();
    }

    function reset() {
      initialize();
      vault = makeVault(core.newState());
      baseline = copy(vault);
      blocked = null; recovered = false; migrated = false; destructivePending = true;
      try {
        // An explicit reset replaces both scoped copies, preventing an old profile
        // from returning through backup recovery. The legacy source is never removed.
        const raw = JSON.stringify(vault);
        write(keys.backup, raw);
        write(keys.main, raw);
        durable = true; initialReadComplete = true; savedAt = vault.updatedAt; destructivePending = false;
        result(true);
      } catch (error) { failed(error); }
      return load();
    }

    return Object.freeze({ keys, load, reload, save, listProfiles, createProfile, switchProfile, deleteProfile,
      getDraft, setDraft, clearDraft, getPreference, setPreference, replaceProfile, resetProfile, reset });
  }

  const api = Object.freeze({ KEY, BACKUP_KEY, LEGACY_KEY, MAX_PROFILES, MAX_DRAFTS, MAX_DRAFT_LENGTH, create });
  globalThis.CoachStorage = api;
  if (typeof window !== 'undefined') window.CoachStorage = api;
})();
