import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = {};
vm.runInNewContext(await readFile(new URL('../assets/core.js', import.meta.url), 'utf8'), sandbox);
vm.runInNewContext(await readFile(new URL('../assets/storage.js', import.meta.url), 'utf8'), sandbox);
const core = sandbox.CoachCore;
const storageAPI = sandbox.CoachStorage;
const plain = value => JSON.parse(JSON.stringify(value));
let instance = 0, clockTick = 0;
const storageError = name => Object.assign(new Error('Simulated browser storage failure'), { name });

class MemoryStorage {
  values = new Map();
  readError = null;
  writeError = null;
  reads = 0;
  writes = 0;
  getItem(key) {
    this.reads++;
    if (this.readError) throw this.readError;
    return this.values.get(key) ?? null;
  }
  setItem(key, value) {
    this.writes++;
    const error = typeof this.writeError === 'function' ? this.writeError(key) : this.writeError;
    if (error) throw error;
    this.values.set(key, String(value));
  }
}

function device(storage = new MemoryStorage(), options = {}) {
  const number = ++instance;
  let id = 0;
  return storageAPI.create({ storage, now: () => new Date(Date.UTC(2026, 10, 5, 8, 0, clockTick++)),
    makeID: () => `profile-${number}-${++id}`, ...options });
}

function exampleState(name = 'Mina') {
  const state = core.newState();
  state.profile.name = name;
  state.profile.showThai = true;
  state.profile.level = 'B1';
  state.completedLessons = ['maritime-b1'];
  state.notes = 'Practise asking a follow-up question.';
  state.sessions = [{ id: 'practice-1', type: 'speaking', date: '2026-11-05T07:00:00.000Z', seconds: 95,
    source: 'typed', score: null, words: 14, label: 'A useful response', detail: 'Completed practice' }];
  return state;
}

function storedProfile(storage, store, id) {
  return JSON.parse(storage.values.get(store.keys.main)).profiles.find(profile => profile.id === id);
}

test('a new learner still needs a profile after preferences, drafts, saves, and reload', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const first = store.load();
  assert.equal(first.status.ok, true);
  assert.equal(first.needsProfile, true);
  assert.equal(first.profiles.length, 1);
  assert.equal(storedProfile(memory, store, first.activeProfileId).setupComplete, false);
  store.setPreference('lastRoute', '#/dashboard');
  store.setPreference('showThaiGuide', true);
  store.setDraft('practice:topic', 'An unfinished response');
  first.state.profile.name = 'A name entered outside setup';
  first.state.notes = 'Pending notes';
  assert.equal(store.save(first.state).ok, true);
  const reopened = device(memory).load();
  assert.equal(reopened.needsProfile, true);
  assert.equal(reopened.activeProfileId, first.activeProfileId);
  assert.equal(reopened.state.notes, first.state.notes);
});

test('first profile creation completes the existing learner and returns ready on the next visit', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const first = store.load();
  store.setPreference('showThaiGuide', true);
  store.setDraft('practice:topic', 'Keep this response');
  const created = store.createProfile('  Niran\n Lee  ');
  assert.equal(created.status.ok, true);
  assert.equal(created.needsProfile, false);
  assert.equal(created.activeProfileId, first.activeProfileId);
  assert.equal(created.state.profile.name, 'Niran Lee');
  assert.equal(store.listProfiles().length, 1);
  assert.equal(store.getDraft('practice:topic'), 'Keep this response');
  assert.equal(store.getPreference('showThaiGuide'), true);
  const reopened = device(memory).load();
  assert.equal(reopened.needsProfile, false);
  assert.equal(reopened.activeProfileId, created.activeProfileId);
  assert.equal(reopened.state.profile.name, 'Niran Lee');
  const second = store.createProfile('Mina');
  assert.equal(second.needsProfile, false);
  assert.notEqual(second.activeProfileId, created.activeProfileId);
  assert.equal(store.listProfiles().length, 2);
});

test('blank profile names cannot complete setup or add a learner', () => {
  const memory = new MemoryStorage(), store = device(memory);
  for (const setupComplete of [false, true]) {
    if (setupComplete) store.createProfile('Mina');
    const before = store.load(), original = memory.values.get(store.keys.main), writes = memory.writes;
    for (const name of ['', '  ', '\n\t']) {
      const rejected = store.createProfile(name);
      assert.equal(rejected.status.error, 'invalid-profile-name');
      assert.equal(rejected.needsProfile, !setupComplete);
      assert.equal(rejected.activeProfileId, before.activeProfileId);
      assert.deepEqual(plain(rejected.state), plain(before.state));
      assert.equal(store.listProfiles().length, 1);
      assert.equal(memory.values.get(store.keys.main), original);
      assert.equal(memory.writes, writes);
    }
  }
});

test('existing version 2 learners without a setup marker remain ready to use', () => {
  const memory = new MemoryStorage(), original = device(memory);
  original.load();
  const raw = JSON.parse(memory.values.get(original.keys.main));
  delete raw.profiles[0].setupComplete;
  memory.values.set(original.keys.main, JSON.stringify(raw));
  const store = device(memory), loaded = store.load();
  assert.equal(loaded.needsProfile, false);
  assert.equal(loaded.state.profile.name, 'Learner');
  store.save(loaded.state);
  assert.equal(storedProfile(memory, store, loaded.activeProfileId).setupComplete, true);
  assert.notEqual(store.createProfile('Another learner').activeProfileId, loaded.activeProfileId);
});

test('failed setup writes remain explicit while completion can be retried without another profile', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const first = store.load(), original = memory.values.get(store.keys.main);
  memory.writeError = key => key === store.keys.main ? storageError('QuotaExceededError') : null;
  const completed = store.createProfile('Mina');
  assert.equal(completed.needsProfile, false);
  assert.equal(completed.status.ok, false);
  assert.equal(completed.status.error, 'quota-exceeded');
  assert.equal(completed.activeProfileId, first.activeProfileId);
  assert.equal(store.listProfiles().length, 1);
  assert.equal(memory.values.get(store.keys.main), original);
  assert.equal(device(memory).load().needsProfile, true);
  memory.writeError = null;
  assert.equal(store.save(completed.state).ok, true);
  const reopened = device(memory).load();
  assert.equal(reopened.needsProfile, false);
  assert.equal(reopened.state.profile.name, 'Mina');
  assert.equal(reopened.profiles.length, 1);
});

test('unavailable storage allows session-only setup and reports that it is not durable', () => {
  const memory = new MemoryStorage();
  memory.readError = storageError('SecurityError');
  const store = device(memory), first = store.load();
  assert.equal(first.needsProfile, true);
  const completed = store.createProfile('Mina');
  assert.equal(completed.needsProfile, false);
  assert.equal(completed.activeProfileId, first.activeProfileId);
  assert.equal(completed.status.ok, false);
  assert.equal(completed.status.available, false);
  assert.equal(completed.status.error, 'storage-unavailable');
  assert.equal(memory.values.size, 0);
  assert.equal(device(memory).load().needsProfile, true);
  memory.readError = null;
  assert.equal(store.save(completed.state).ok, true);
  assert.equal(device(memory).load().needsProfile, false);
});

test('import completes setup, learner reset preserves it, and device reset starts setup again', () => {
  const memory = new MemoryStorage(), store = device(memory);
  assert.equal(store.load().needsProfile, true);
  assert.equal(store.resetProfile().needsProfile, true);
  const imported = store.replaceProfile(exampleState('Imported learner'));
  assert.equal(imported.status.ok, true);
  assert.equal(imported.needsProfile, false);
  assert.equal(device(memory).load().needsProfile, false);
  assert.equal(store.resetProfile().needsProfile, false);
  const reset = store.reset();
  assert.equal(reset.needsProfile, true);
  assert.equal(reset.profiles.length, 1);
  assert.equal(device(memory).load().needsProfile, true);
});

test('legacy progress migrates without modifying its source and reloads as the same learner', () => {
  const memory = new MemoryStorage();
  const legacy = exampleState();
  legacy.apiKey = 'must-not-copy-this-key';
  legacy.profile.endpoint = 'https://private.invalid';
  const original = JSON.stringify(legacy, null, 2);
  memory.values.set(storageAPI.LEGACY_KEY, original);
  const store = device(memory);
  const loaded = store.load();
  assert.equal(loaded.migrated, true);
  assert.equal(loaded.needsProfile, false);
  assert.equal(loaded.status.ok, true);
  assert.equal(loaded.status.recovered, false);
  assert.deepEqual(plain(loaded.state), plain(core.normalizeState(legacy)));
  assert.equal(memory.values.get(storageAPI.LEGACY_KEY), original);
  assert.equal(memory.values.get(store.keys.main).includes('must-not-copy-this-key'), false);
  assert.equal(memory.values.get(store.keys.backup).includes('must-not-copy-this-key'), false);
  const reopened = device(memory).load();
  assert.equal(reopened.migrated, false);
  assert.equal(reopened.needsProfile, false);
  assert.equal(reopened.activeProfileId, loaded.activeProfileId);
  assert.deepEqual(plain(reopened.state), plain(loaded.state));
});

test('repository namespaces isolate vaults and backups while leaving the legacy source global', () => {
  const memory = new MemoryStorage();
  const one = device(memory, { namespace: '/first-project/' });
  const two = device(memory, { namespace: '/second-project/' });
  const first = one.load();
  first.state.notes = 'Only the first repository.';
  assert.equal(one.save(first.state).ok, true);
  assert.equal(two.load().state.notes, '');
  assert.notEqual(one.keys.main, two.keys.main);
  assert.notEqual(one.keys.backup, two.keys.backup);
  assert.equal(one.keys.legacy, storageAPI.LEGACY_KEY);
  assert.equal(two.keys.legacy, storageAPI.LEGACY_KEY);
  assert.equal(device(memory, { namespace: '/first-project/' }).load().state.notes, first.state.notes);
  assert.equal(device(memory).keys.main, storageAPI.KEY);
  assert.equal(device(memory).keys.backup, storageAPI.BACKUP_KEY);
});

test('profiles preserve independent progress, drafts, preferences, and defensive snapshots', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.createProfile('Mina');
  const first = store.load();
  assert.equal(store.save(exampleState('Mina')).ok, true);
  store.setDraft('practice:maritime-b1', 'Please explain the situation.');
  store.setPreference('showThaiGuide', true);
  store.setPreference('lastRoute', '#/practice/maritime-b1');
  const second = store.createProfile('  Niran\n Lee  ');
  assert.equal(second.status.ok, true);
  assert.equal(second.state.profile.name, 'Niran Lee');
  assert.equal(second.state.sessions.length, 0);
  assert.equal(store.getDraft('practice:maritime-b1'), '');
  assert.equal(store.getPreference('showThaiGuide'), undefined);
  store.setDraft('practice:maritime-b1', 'A separate learner response.');
  store.setPreference('showThaiGuide', false);
  second.state.notes = 'My own learning notes';
  store.save(second.state);
  assert.equal(device(memory).load().activeProfileId, second.activeProfileId);
  const switched = store.switchProfile(first.activeProfileId);
  assert.equal(switched.state.profile.name, 'Mina');
  assert.equal(switched.state.sessions.length, 1);
  assert.equal(store.getDraft('practice:maritime-b1'), 'Please explain the situation.');
  assert.equal(store.getPreference('showThaiGuide'), true);
  assert.equal(store.getPreference('lastRoute'), '#/practice/maritime-b1');
  const snapshots = store.listProfiles();
  snapshots[0].state.notes = 'Do not mutate the store';
  snapshots[0].state.sessions.length = 0;
  switched.state.profile.name = 'Do not rename the store';
  assert.equal(store.load().state.profile.name, 'Mina');
  assert.equal(store.load().state.sessions.length, 1);
  assert.equal(store.listProfiles().find(p => p.id === second.activeProfileId).state.notes, 'My own learning notes');
});

test('per-topic drafts remain independent, bounded, and restricted to text practice', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.load();
  store.setDraft('practice:topic-one', 'First response');
  store.setDraft('practice:topic-two', 'Second response');
  store.setDraft('pronunciation:phrase-one', 'My read-aloud attempt');
  store.clearDraft('practice:topic-one');
  assert.equal(store.getDraft('practice:topic-one'), '');
  assert.equal(store.getDraft('practice:topic-two'), 'Second response');
  assert.equal(store.getDraft('pronunciation:phrase-one'), 'My read-aloud attempt');
  store.setDraft('practice:long', 'a'.repeat(5000) + '\u0000');
  assert.equal(store.getDraft('practice:long').length, storageAPI.MAX_DRAFT_LENGTH);
  for (const key of ['conversation:full-history', 'apiKey', '__proto__', 'practice:<unsafe>']) {
    assert.equal(store.setDraft(key, 'not allowed').error, 'invalid-draft');
    assert.equal(store.getDraft(key), '');
  }
  assert.equal(store.setDraft('practice:object', { token: 'secret' }).error, 'invalid-draft');
  const reopened = device(memory);
  reopened.load();
  assert.equal(reopened.getDraft('practice:topic-two'), 'Second response');
  assert.equal(reopened.getDraft('pronunciation:phrase-one'), 'My read-aloud attempt');
  for (let i = 0; i < storageAPI.MAX_DRAFTS - 3; i++) reopened.setDraft(`practice:bounded-${i}`, 'A response');
  assert.equal(reopened.setDraft('practice:overflow', 'No hidden eviction').error, 'draft-limit');
  assert.equal(reopened.getDraft('practice:topic-two'), 'Second response');
});

test('preferences reject credentials, arbitrary fields, and external or malformed routes', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.load();
  assert.equal(store.setPreference('showThaiGuide', false).ok, true);
  assert.equal(store.getPreference('showThaiGuide'), false);
  for (const [key, value] of [
    ['apiKey', 'secret'], ['endpoint', 'https://external.invalid'], ['classroomCode', 'secret'],
    ['showThaiGuide', 'true'], ['lastRoute', 'https://external.invalid'],
    ['lastRoute', 'javascript:alert(1)'], ['lastRoute', '#//external'], ['lastRoute', '#/unlisted'],
    ['lastRoute', '#/home?token=secret'], ['__proto__', { secret: true }]
  ]) assert.equal(store.setPreference(key, value).error, 'invalid-preference', String(key) + ':' + String(value));
  assert.equal(store.setPreference('lastRoute', '#/pronunciation/phrase-1').ok, true);
  assert.equal(memory.values.get(store.keys.main).includes('secret'), false);
});

test('quota failures keep unsaved progress and drafts in memory and retain the previous durable timestamp', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const first = store.load();
  const originalMain = memory.values.get(store.keys.main);
  memory.writeError = storageError('QuotaExceededError');
  const state = exampleState('Unsaved learner');
  const failure = store.save(state);
  assert.equal(failure.ok, false);
  assert.equal(failure.available, true);
  assert.equal(failure.error, 'quota-exceeded');
  assert.equal(failure.savedAt, first.status.savedAt);
  assert.equal(store.setDraft('practice:topic', 'Keep this unfinished answer.').ok, false);
  assert.equal(store.load().state.profile.name, 'Unsaved learner');
  assert.equal(store.getDraft('practice:topic'), 'Keep this unfinished answer.');
  assert.equal(memory.values.get(store.keys.main), originalMain);
  memory.writeError = null;
  assert.equal(store.save(store.load().state).ok, true);
  const reopened = device(memory);
  assert.equal(reopened.load().state.profile.name, 'Unsaved learner');
  assert.equal(reopened.getDraft('practice:topic'), 'Keep this unfinished answer.');
});

test('a failed main write leaves the old main and a valid previous-good backup', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const first = store.load();
  const state = first.state;
  state.notes = 'Already saved';
  store.save(state);
  const oldMain = memory.values.get(store.keys.main);
  const previousSavedAt = store.load().status.savedAt;
  memory.writeError = key => key === store.keys.main ? storageError('QuotaExceededError') : null;
  state.notes = 'Still only in memory';
  assert.equal(store.save(state).ok, false);
  assert.equal(store.load().state.notes, 'Still only in memory');
  assert.equal(store.load().status.savedAt, previousSavedAt);
  assert.equal(memory.values.get(store.keys.main), oldMain);
  assert.equal(memory.values.get(store.keys.backup), oldMain);
  memory.writeError = null;
  assert.equal(device(memory).load().state.notes, 'Already saved');
  assert.equal(store.save(store.load().state).ok, true);
  assert.equal(device(memory).load().state.notes, 'Still only in memory');
});

test('blocked reads are explicit, load remains cached, and unsaved work survives a later successful write', () => {
  const memory = new MemoryStorage();
  memory.readError = storageError('SecurityError');
  const store = device(memory);
  const loaded = store.load();
  assert.equal(loaded.status.ok, false);
  assert.equal(loaded.status.available, false);
  assert.equal(loaded.status.error, 'storage-unavailable');
  const reads = memory.reads;
  store.load();
  assert.equal(memory.reads, reads);
  loaded.state.notes = 'Remember this even with storage blocked.';
  assert.equal(store.save(loaded.state).ok, false);
  assert.equal(store.load().state.notes, loaded.state.notes);
  assert.equal(memory.values.size, 0);
  memory.readError = null;
  assert.equal(store.save(store.load().state).ok, true);
  assert.equal(device(memory).load().state.notes, loaded.state.notes);
});

test('returning storage access cannot hide legacy progress behind a new memory-only learner', () => {
  const memory = new MemoryStorage();
  const legacy = JSON.stringify(exampleState('Previously saved learner'));
  memory.values.set(storageAPI.LEGACY_KEY, legacy);
  memory.readError = storageError('SecurityError');
  const store = device(memory), local = store.load();
  local.state.notes = 'Work entered while reads were blocked';
  store.save(local.state);
  memory.readError = null;
  assert.equal(store.save(local.state).error, 'conflict');
  assert.equal(store.load().state.notes, local.state.notes);
  assert.equal(memory.values.has(store.keys.main), false);
  assert.equal(memory.values.get(storageAPI.LEGACY_KEY), legacy);
  const accepted = store.reload();
  assert.equal(accepted.state.profile.name, 'Previously saved learner');
  assert.equal(accepted.migrated, true);
  assert.equal(accepted.status.ok, true);
});

test('corrupt main data restores the previous-good backup with an explicit recovered status', () => {
  const memory = new MemoryStorage(), store = device(memory);
  const state = store.load().state;
  state.notes = 'First saved version'; store.save(state);
  state.notes = 'Second saved version'; store.save(state);
  const backup = memory.values.get(store.keys.backup);
  memory.values.set(store.keys.main, '{broken JSON');
  const recovered = device(memory).load();
  assert.equal(recovered.status.ok, true);
  assert.equal(recovered.status.recovered, true);
  assert.equal(recovered.state.notes, 'First saved version');
  assert.equal(recovered.status.savedAt, JSON.parse(backup).updatedAt);
  assert.equal(memory.values.get(store.keys.main), backup);
  assert.equal(memory.values.get(store.keys.backup), backup);
});

test('a failed recovery repair keeps the backup usable and can later save pending work', () => {
  const memory = new MemoryStorage(), original = device(memory);
  original.load();
  original.save(exampleState('Recovered learner'));
  original.save(exampleState('Latest learner'));
  memory.values.set(original.keys.main, 'corrupt');
  memory.writeError = storageError('QuotaExceededError');
  const store = device(memory), loaded = store.load();
  assert.equal(loaded.state.profile.name, 'Recovered learner');
  assert.equal(loaded.status.recovered, true);
  assert.equal(loaded.status.ok, false);
  assert.equal(loaded.status.error, 'quota-exceeded');
  loaded.state.notes = 'A new note after recovery';
  store.save(loaded.state);
  assert.equal(store.load().state.notes, loaded.state.notes);
  memory.writeError = null;
  assert.equal(store.save(store.load().state).ok, true);
  assert.equal(device(memory).load().state.notes, loaded.state.notes);
});

test('unrecoverable corruption stays untouched until an explicit namespace reset', () => {
  const memory = new MemoryStorage();
  const legacy = JSON.stringify(exampleState('Legacy learner'));
  memory.values.set(storageAPI.LEGACY_KEY, legacy);
  memory.values.set(storageAPI.KEY, '{broken current vault');
  memory.values.set(storageAPI.BACKUP_KEY, '{broken backup');
  const store = device(memory), loaded = store.load();
  assert.equal(loaded.needsProfile, true);
  assert.equal(loaded.status.error, 'corrupt-data');
  assert.equal(loaded.status.ok, false);
  loaded.state.notes = 'Keep the current attempt in memory';
  assert.equal(store.save(loaded.state).error, 'corrupt-data');
  assert.equal(store.load().state.notes, loaded.state.notes);
  assert.equal(memory.values.get(storageAPI.KEY), '{broken current vault');
  assert.equal(memory.values.get(storageAPI.BACKUP_KEY), '{broken backup');
  const reset = store.reset();
  assert.equal(reset.status.ok, true);
  assert.equal(reset.state.notes, '');
  assert.equal(reset.profiles.length, 1);
  assert.equal(memory.values.get(storageAPI.LEGACY_KEY), legacy);
  assert.equal(memory.values.get(storageAPI.KEY), memory.values.get(storageAPI.BACKUP_KEY));
});

test('duplicate learner IDs, invalid active IDs, and unknown future vaults cannot silently replace progress', () => {
  for (const kind of ['duplicate', 'active', 'future']) {
    const memory = new MemoryStorage(), original = device(memory);
    original.load();
    original.save(exampleState());
    const raw = JSON.parse(memory.values.get(original.keys.main));
    if (kind === 'duplicate') raw.profiles.push(plain(raw.profiles[0]));
    if (kind === 'active') raw.activeProfileId = 'missing-profile';
    if (kind === 'future') raw.version = 99;
    const damaged = JSON.stringify(raw);
    memory.values.set(original.keys.main, damaged);
    if (kind !== 'future') memory.values.delete(original.keys.backup);
    const store = device(memory), loaded = store.load();
    assert.equal(loaded.status.error, kind === 'future' ? 'unsupported-version' : 'corrupt-data');
    assert.equal(store.save(exampleState('New work')).ok, false);
    assert.equal(memory.values.get(original.keys.main), damaged);
  }
});

test('vault normalization excludes unsafe fields while retaining bounded learner content', () => {
  const memory = new MemoryStorage(), original = device(memory);
  original.load();
  const raw = JSON.parse(memory.values.get(original.keys.main));
  raw.apiKey = 'unsafe-secret';
  raw.profiles[0].token = 'unsafe-secret';
  raw.profiles[0].state.apiKey = 'unsafe-secret';
  raw.profiles[0].state.profile.endpoint = 'unsafe-secret';
  raw.profiles[0].drafts = { 'practice:valid': 'd'.repeat(4500), 'conversation:history': 'unsafe-secret', token: 'unsafe-secret' };
  raw.profiles[0].preferences = { showThaiGuide: true, lastRoute: '#/dashboard', classroomCode: 'unsafe-secret' };
  memory.values.set(original.keys.main, JSON.stringify(raw));
  const store = device(memory), loaded = store.load();
  assert.equal(store.getDraft('practice:valid').length, storageAPI.MAX_DRAFT_LENGTH);
  assert.equal(store.getPreference('showThaiGuide'), true);
  assert.equal(store.save(loaded.state).ok, true);
  assert.equal(memory.values.get(original.keys.main).includes('unsafe-secret'), false);
  assert.equal(memory.values.get(original.keys.backup).includes('unsafe-secret'), false);
});

test('same-origin tabs preserve newer unrelated learner profiles when saving', () => {
  const memory = new MemoryStorage(), seed = device(memory);
  seed.createProfile('First learner');
  const firstID = seed.load().activeProfileId;
  const secondID = seed.createProfile('Second learner').activeProfileId;
  seed.switchProfile(firstID);
  const left = device(memory), right = device(memory);
  const leftState = left.load().state;
  right.load(); right.switchProfile(secondID);
  const rightState = right.load().state;
  rightState.notes = 'Newer work by the second learner';
  assert.equal(right.save(rightState).ok, true);
  leftState.notes = 'Independent work by the first learner';
  assert.equal(left.save(leftState).ok, true);
  assert.equal(left.load().activeProfileId, firstID);
  assert.equal(storedProfile(memory, left, secondID).state.notes, rightState.notes);
  assert.equal(storedProfile(memory, left, firstID).state.notes, leftState.notes);
  rightState.notes = 'Another update from the second tab';
  assert.equal(right.save(rightState).ok, true);
  assert.equal(storedProfile(memory, left, firstID).state.notes, leftState.notes);
});

test('same-profile conflicts preserve local attempts and require explicit reload to accept external work', () => {
  const memory = new MemoryStorage(), left = device(memory);
  const local = left.load();
  const right = device(memory), external = right.load();
  external.state.notes = 'Saved in the other tab';
  right.save(external.state);
  local.state.notes = 'My unfinished local work';
  const failure = left.save(local.state);
  assert.equal(failure.error, 'conflict');
  assert.equal(failure.ok, false);
  assert.equal(left.load().state.notes, local.state.notes);
  assert.equal(left.setDraft('practice:topic', 'My local draft').error, 'conflict');
  assert.equal(left.getDraft('practice:topic'), 'My local draft');
  assert.equal(storedProfile(memory, right, external.activeProfileId).state.notes, external.state.notes);
  const accepted = left.reload();
  assert.equal(accepted.state.notes, external.state.notes);
  assert.equal(accepted.status.ok, true);
  assert.equal(left.getDraft('practice:topic'), '');
});

test('even a no-op save cannot silently swap the app state after another tab changes that learner', () => {
  const memory = new MemoryStorage(), left = device(memory);
  const original = left.load();
  const right = device(memory), updated = right.load();
  updated.state.profile.name = 'Changed elsewhere';
  right.save(updated.state);
  assert.equal(left.save(original.state).error, 'conflict');
  assert.equal(left.load().state.profile.name, 'Learner');
  assert.equal(left.load().activeProfileId, original.activeProfileId);
  assert.equal(right.load().state.profile.name, 'Changed elsewhere');
});

test('deleting a learner in another tab cannot redirect a stale save into a remaining profile', () => {
  const memory = new MemoryStorage(), left = device(memory);
  left.createProfile('First learner');
  const firstID = left.load().activeProfileId;
  const secondID = left.createProfile('Remaining learner').activeProfileId;
  left.switchProfile(firstID);
  const original = left.load();
  const right = device(memory); right.load(); right.deleteProfile(firstID);
  original.state.notes = 'Unsaved work for the removed profile';
  assert.equal(left.save(original.state).error, 'conflict');
  assert.equal(left.load().activeProfileId, firstID);
  assert.equal(left.load().state.notes, original.state.notes);
  assert.equal(storedProfile(memory, left, secondID).state.notes, '');
});

test('profile limits and duplicate ID generators never change selection on a rejected creation', () => {
  const memory = new MemoryStorage(), store = device(memory, { makeID: () => 'same-id' });
  store.createProfile('First learner');
  for (let i = 1; i < storageAPI.MAX_PROFILES; i++) assert.equal(store.createProfile(`Learner ${i}`).status.ok, true);
  const before = store.load();
  const rejected = store.createProfile('Too many');
  assert.equal(rejected.status.error, 'profile-limit');
  assert.equal(rejected.activeProfileId, before.activeProfileId);
  assert.equal(store.listProfiles().length, storageAPI.MAX_PROFILES);
  assert.equal(new Set(store.listProfiles().map(profile => profile.id)).size, storageAPI.MAX_PROFILES);
  assert.equal(store.switchProfile('missing').status.error, 'profile-not-found');
  assert.equal(store.load().activeProfileId, before.activeProfileId);
});

test('a concurrent last-slot creation preserves the winner and leaves the rejected tab on its previous learner', () => {
  const memory = new MemoryStorage(), seed = device(memory);
  seed.createProfile('First learner');
  for (let i = 1; i < 7; i++) seed.createProfile(`Learner ${i}`);
  const left = device(memory), before = left.load();
  const right = device(memory); right.load();
  const winner = right.createProfile('Final slot');
  const rejected = left.createProfile('Too late');
  assert.equal(winner.status.ok, true);
  assert.equal(rejected.status.error, 'profile-limit');
  assert.equal(rejected.activeProfileId, before.activeProfileId);
  assert.equal(left.listProfiles().length, 7);
  const disk = device(memory).load();
  assert.equal(disk.profiles.length, 8);
  assert.ok(disk.profiles.some(profile => profile.id === winner.activeProfileId));
});

test('profile deletion leaves a usable selected learner and rejects removal of the last profile', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.createProfile('First learner');
  const first = store.load();
  const lastFailure = store.deleteProfile(first.activeProfileId);
  assert.equal(lastFailure.status.error, 'last-profile');
  assert.equal(lastFailure.activeProfileId, first.activeProfileId);
  const second = store.createProfile('Temporary learner');
  store.setDraft('practice:topic', 'Only this learner');
  const removed = store.deleteProfile(second.activeProfileId);
  assert.equal(removed.status.ok, true);
  assert.equal(removed.activeProfileId, first.activeProfileId);
  assert.equal(store.getDraft('practice:topic'), '');
  assert.equal(device(memory).load().profiles.length, 1);
});

test('profile replacement and reset atomically clear only the selected learner’s state, drafts, and preferences', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.createProfile('First learner');
  const firstID = store.load().activeProfileId;
  store.save(exampleState());
  store.setDraft('practice:topic', 'A draft for the first learner');
  store.setPreference('showThaiGuide', true);
  const secondID = store.createProfile('Other learner').activeProfileId;
  store.setDraft('practice:topic', 'Keep the other learner draft');
  store.setPreference('showThaiGuide', false);
  store.switchProfile(firstID);
  const replacement = exampleState('Imported learner');
  replacement.notes = 'Imported notes';
  const replaced = store.replaceProfile(replacement);
  assert.equal(replaced.status.ok, true);
  assert.equal(replaced.activeProfileId, firstID);
  assert.equal(store.getDraft('practice:topic'), '');
  assert.equal(store.getPreference('showThaiGuide'), undefined);
  assert.equal(storedProfile(memory, store, secondID).drafts['practice:topic'], 'Keep the other learner draft');
  const originalRaw = memory.values.get(store.keys.main);
  memory.writeError = storageError('QuotaExceededError');
  const reset = store.resetProfile();
  assert.equal(reset.status.ok, false);
  assert.equal(reset.activeProfileId, firstID);
  assert.deepEqual(plain(reset.state), plain(core.newState()));
  assert.equal(memory.values.get(store.keys.main), originalRaw);
  memory.writeError = null;
  assert.equal(store.save(store.load().state).ok, true);
  const reopened = device(memory);
  assert.equal(reopened.load().state.notes, '');
  reopened.switchProfile(secondID);
  assert.equal(reopened.getDraft('practice:topic'), 'Keep the other learner draft');
  assert.equal(reopened.getPreference('showThaiGuide'), false);
});

test('cleared drafts cannot return through recovery while other drafts remain intact', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.load();
  store.setDraft('practice:clear-me', 'Text explicitly removed by the learner');
  store.setDraft('pronunciation:keep-me', 'An unfinished different exercise');
  assert.equal(store.clearDraft('practice:clear-me').ok, true);
  assert.equal(memory.values.get(store.keys.backup).includes('Text explicitly removed'), false);
  memory.values.set(store.keys.main, '{corrupt after clear');
  const restored = device(memory);
  assert.equal(restored.load().status.recovered, true);
  assert.equal(restored.getDraft('practice:clear-me'), '');
  assert.equal(restored.getDraft('pronunciation:keep-me'), 'An unfinished different exercise');
});

test('profile reset and replacement remove prior learner data from both durable copies', () => {
  for (const operation of ['reset', 'replace']) {
    const memory = new MemoryStorage(), store = device(memory);
    store.createProfile('First learner');
    const target = store.load().activeProfileId;
    store.save(exampleState('Prior learner name'));
    store.setDraft('practice:topic', 'Prior learner draft');
    store.setPreference('showThaiGuide', false);
    const otherID = store.createProfile('Unrelated learner').activeProfileId;
    store.setDraft('practice:topic', 'Keep this other learner draft');
    store.switchProfile(target);
    const expected = operation === 'reset' ? core.newState() : exampleState('Imported learner name');
    const changed = operation === 'reset' ? store.resetProfile() : store.replaceProfile(expected);
    assert.equal(changed.status.ok, true);
    assert.equal(memory.values.get(store.keys.backup).includes('Prior learner'), false);
    memory.values.set(store.keys.main, '{corrupt after profile replacement');
    const restored = device(memory), loaded = restored.load();
    assert.equal(loaded.status.recovered, true);
    assert.equal(loaded.activeProfileId, target);
    assert.deepEqual(plain(loaded.state), plain(expected));
    assert.equal(restored.getDraft('practice:topic'), '');
    assert.equal(restored.getPreference('showThaiGuide'), undefined);
    restored.switchProfile(otherID);
    assert.equal(restored.getDraft('practice:topic'), 'Keep this other learner draft');
  }
});

test('deleting a nonactive profile purges its recovery data and preserves newer unrelated work', () => {
  const memory = new MemoryStorage(), seed = device(memory);
  seed.createProfile('First learner');
  const firstID = seed.load().activeProfileId;
  const removedID = seed.createProfile('Removed learner').activeProfileId;
  seed.setDraft('practice:topic', 'Removed learner text');
  const retainedID = seed.createProfile('Retained learner').activeProfileId;
  seed.switchProfile(firstID);
  const left = device(memory); left.load();
  const right = device(memory); right.load(); right.switchProfile(retainedID);
  const newer = right.load().state;
  newer.notes = 'Latest work from another tab';
  right.save(newer);
  right.setDraft('practice:topic', 'Latest retained draft');
  assert.equal(left.deleteProfile(removedID).status.ok, true);
  assert.equal(memory.values.get(left.keys.backup).includes('Removed learner'), false);
  memory.values.set(left.keys.main, '{corrupt after deletion');
  const restored = device(memory), loaded = restored.load();
  assert.equal(loaded.status.recovered, true);
  assert.equal(loaded.activeProfileId, firstID);
  assert.equal(loaded.profiles.some(profile => profile.id === removedID), false);
  assert.equal(loaded.profiles.find(profile => profile.id === retainedID).state.notes, newer.notes);
  restored.switchProfile(retainedID);
  assert.equal(restored.getDraft('practice:topic'), 'Latest retained draft');
});

test('failed destructive writes report failure and keep removal intent through a normal save retry', () => {
  const memory = new MemoryStorage(), store = device(memory);
  store.load();
  store.setDraft('practice:topic', 'Text to remove permanently from scoped copies');
  const previousMain = memory.values.get(store.keys.main);
  memory.writeError = key => key === store.keys.main ? storageError('QuotaExceededError') : null;
  const failedClear = store.clearDraft('practice:topic');
  assert.equal(failedClear.ok, false);
  assert.equal(failedClear.error, 'quota-exceeded');
  assert.equal(memory.values.get(store.keys.main), previousMain);
  assert.equal(store.getDraft('practice:topic'), '');
  memory.writeError = null;
  assert.equal(store.save(store.load().state).ok, true);
  assert.equal(memory.values.get(store.keys.backup).includes('Text to remove permanently'), false);
  memory.values.set(store.keys.main, '{corrupt after successful retry');
  const restored = device(memory);
  assert.equal(restored.load().status.recovered, true);
  assert.equal(restored.getDraft('practice:topic'), '');
});
