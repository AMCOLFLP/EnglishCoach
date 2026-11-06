import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sources = await Promise.all(['content', 'core', 'storage', 'app'].map(async name =>
  [name, await readFile(new URL(`../assets/${name}.js`, import.meta.url), 'utf8')]));
const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g,
  (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[entity]);

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

// This deliberately small DOM supports the app's routing and forms, not browser
// layout, native constraint validation, speech, service workers, or focus traps.
class Element {
  constructor(tag = '', attributes = {}, parent = null) {
    this.tagName = tag.toUpperCase();
    this.attributes = attributes;
    this.parent = parent;
    this.children = [];
    this.listeners = new Map();
    this.dataset = Object.fromEntries(Object.entries(attributes)
      .filter(([key]) => key.startsWith('data-')).map(([key, value]) => [key.slice(5), value]));
    this.id = attributes.id || '';
    this.hidden = 'hidden' in attributes;
    this.disabled = 'disabled' in attributes;
    this.checked = 'checked' in attributes;
    this.value = attributes.value || '';
    this.open = false;
    const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      contains: value => classes.has(value),
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      toggle(value, force = !classes.has(value)) {
        if (force) classes.add(value); else classes.delete(value);
        return force;
      }
    };
  }
  set innerHTML(html) {
    this._html = html;
    this.children = [];
    const stack = [this];
    const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g)) {
      const token = match[0];
      if (token.startsWith('<!')) continue;
      if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      if (token.startsWith('<')) {
        const tag = token.match(/^<([\w-]+)/)[1].toLowerCase();
        const attributes = {};
        for (const attribute of token.slice(tag.length + 1, -1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
          attributes[attribute[1]] = decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
        }
        const parent = stack.at(-1), child = new Element(tag, attributes, parent);
        parent.children.push(child);
        if (!voids.has(tag) && !token.endsWith('/>')) stack.push(child);
      } else {
        const parent = stack.at(-1), text = decode(token);
        parent.children.push(text);
        if (parent.tagName === 'TEXTAREA') parent.value += text;
      }
    }
  }
  get innerHTML() { return this._html || ''; }
  get textContent() { return this.children.map(child => typeof child === 'string' ? child : child.textContent).join(''); }
  set textContent(value) { this.children = [String(value)]; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attribute = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (attribute) return attribute[1] in this.attributes && (attribute[2] === undefined || this.attributes[attribute[1]] === attribute[2]);
    return this.tagName === selector.toUpperCase();
  }
  querySelectorAll(selector) {
    const descendants = [];
    const visit = node => { for (const child of node.children) if (child instanceof Element) { descendants.push(child); visit(child); } };
    visit(this);
    return descendants.filter(node => selector.split(',').some(part => {
      const segments = part.trim().split(/\s+/);
      if (!node.matches(segments.pop())) return false;
      let ancestor = node.parent;
      while (segments.length) {
        const segment = segments.pop();
        while (ancestor && !ancestor.matches(segment)) ancestor = ancestor.parent;
        if (!ancestor) return false;
        ancestor = ancestor.parent;
      }
      return true;
    }));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  async dispatch(type, event = {}) {
    event.target ||= this;
    event.preventDefault ||= () => { event.defaultPrevented = true; };
    for (const callback of this.listeners.get(type) || []) await callback(event);
    return event;
  }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}

function openApp({ storage = new MemoryStorage(), hash = '', denyStorage = false } = {}) {
  const document = new Element('document');
  document.innerHTML = shell;
  document.body = document.querySelector('body');
  document.getElementById = id => document.querySelector(`#${id}`);
  document.title = document.querySelector('title').textContent;
  document.visibilityState = 'visible';
  const initialTitle = document.title;
  const window = new Element('window');
  const location = new URL(`https://coach.example/EnglishCoach/${hash}`);
  const history = { replaceState(_state, _title, url) { location.href = new URL(url, location.href).href; } };
  Object.assign(window, { document, location, history, matchMedia: () => new Element('media-query'), scrollTo() {} });
  Object.defineProperty(window, 'localStorage', { get() {
    if (denyStorage) throw Object.assign(new Error('Storage blocked'), { name: 'SecurityError' });
    return storage;
  } });
  let timer = 0;
  const sandbox = vm.createContext({ window, document, location, history, URL,
    performance: { now: () => 1000 }, setInterval: () => ++timer,
    setTimeout: () => ++timer, clearTimeout() {}, requestAnimationFrame: callback => callback() });
  for (const [name, source] of sources) vm.runInContext(source, sandbox, { filename: `assets/${name}.js` });
  const app = {
    document, window, location, storage, initialTitle, sandbox,
    element: id => document.getElementById(id),
    async navigate(nextHash) { location.hash = nextHash; await window.dispatch('hashchange'); },
    async create(name) {
      app.element('new-profile-name').value = name;
      return document.dispatch('submit', { target: app.element('create-profile-form') });
    },
    async click(action) {
      const target = document.querySelector(`[data-action="${action}"]`);
      assert.ok(target, `Expected visible ${action} action`);
      assert.equal(target.disabled, false, `${action} must be enabled`);
      await document.dispatch('click', { target });
    },
    snapshot() {
      return sandbox.CoachStorage.create({ storage, namespace: '/EnglishCoach/' }).load();
    }
  };
  return app;
}

test('fresh opening asks for a profile, and unfinished setup still asks after reload', () => {
  const storage = new MemoryStorage();
  for (const hash of ['', '#/', '#/home']) {
    const app = openApp({ storage, hash });
    assert.equal(app.location.hash, '#/profiles');
    assert.equal(app.element('main').dataset.view, 'profiles');
    assert.ok(app.element('create-profile-form'));
    assert.equal(app.element('new-profile-name').attributes.required, '');
    assert.equal(app.element('profile-name').textContent, 'Create profile');
    assert.equal(app.snapshot().needsProfile, true);
    assert.equal(app.snapshot().profiles.length, 1);
    assert.doesNotMatch(app.initialTitle, /\bAI\b/);
    assert.equal(app.document.title, 'Create profile · English Speaking Coach');
  }
});

test('blank names cannot leave setup, while submitting a name creates one learner and opens the dashboard', async () => {
  const app = openApp();
  const submitted = await app.create('   \t  ');
  assert.equal(submitted.defaultPrevented, true);
  assert.equal(app.location.hash, '#/profiles');
  assert.match(app.element('profile-error').textContent, /Enter a learner name/);
  assert.equal(app.snapshot().needsProfile, true);
  await app.create('  Mali  ');
  assert.equal(app.location.hash, '#/dashboard');
  assert.equal(app.element('main').dataset.view, 'dashboard');
  assert.equal(app.element('profile-name').textContent, 'Mali');
  assert.equal(app.element('create-profile-form'), null);
  assert.equal(app.document.title, 'My progress · English Speaking Coach');
  const saved = app.snapshot();
  assert.equal(saved.needsProfile, false);
  assert.equal(saved.profiles.length, 1);
  assert.equal(saved.state.profile.name, 'Mali');
});

test('returning learners land on the dashboard with saved notes and completed activities', async () => {
  const app = openApp();
  await app.create('Nok');
  app.element('learning-notes').value = 'Practise asking a follow-up question.';
  await app.document.dispatch('input', { target: app.element('learning-notes') });
  await app.click('save-notes');
  const lesson = app.window.CoachContent.lessons[0];
  await app.navigate(`#/lessons/${lesson.id}`);
  for (const checkbox of app.document.querySelectorAll('.lesson-task')) {
    checkbox.checked = true;
    await app.document.dispatch('change', { target: checkbox });
  }
  await app.click('complete-lesson');
  for (const hash of ['', '#/', '#/home']) {
    const reopened = openApp({ storage: app.storage, hash });
    assert.equal(reopened.location.hash, '#/dashboard');
    assert.equal(reopened.element('main').dataset.view, 'dashboard');
    assert.equal(reopened.element('profile-name').textContent, 'Nok');
    assert.equal(reopened.element('learning-notes').value, 'Practise asking a follow-up question.');
    assert.ok(reopened.element('main').textContent.includes(lesson.title));
    assert.equal(reopened.snapshot().profiles.length, 1);
    assert.equal(reopened.snapshot().state.sessions.length, 1);
    assert.ok(reopened.snapshot().state.completedLessons.includes(lesson.id));
  }
});

test('existing v2 profiles without the setup flag and legacy v1 progress remain usable', async () => {
  const original = openApp();
  await original.create('Existing learner');
  for (const [key, raw] of original.storage.values) {
    const vault = JSON.parse(raw);
    for (const profile of vault.profiles) delete profile.setupComplete;
    original.storage.setItem(key, JSON.stringify(vault));
  }
  const previousVersion = openApp({ storage: original.storage });
  assert.equal(previousVersion.location.hash, '#/dashboard');
  assert.equal(previousVersion.element('profile-name').textContent, 'Existing learner');
  const legacyStorage = new MemoryStorage();
  const legacy = original.sandbox.CoachCore.newState();
  legacy.profile.name = 'Legacy learner';
  legacy.notes = 'Keep these earlier notes.';
  legacyStorage.setItem(original.sandbox.CoachStorage.LEGACY_KEY, JSON.stringify(legacy));
  const migrated = openApp({ storage: legacyStorage });
  assert.equal(migrated.location.hash, '#/dashboard');
  assert.equal(migrated.element('profile-name').textContent, 'Legacy learner');
  assert.equal(migrated.element('learning-notes').value, legacy.notes);
});

test('fresh learning deep links require setup; returning learners keep their explicit deep links', async () => {
  const app = openApp();
  const lesson = app.window.CoachContent.lessons[0];
  const hash = `#/lessons/${lesson.id}`;
  const freshLink = openApp({ hash });
  assert.equal(freshLink.location.hash, '#/profiles');
  assert.ok(freshLink.element('create-profile-form'));
  await app.create('Mina');
  const savedLink = openApp({ storage: app.storage, hash });
  assert.equal(savedLink.location.hash, hash);
  assert.equal(savedLink.element('main').dataset.view, 'lessons');
  assert.ok(savedLink.element('main').textContent.includes(lesson.title));
  assert.equal(savedLink.document.title, 'Lessons · English Speaking Coach');
});

test('adding another learner through the existing dialog still works', async () => {
  const app = openApp();
  await app.create('First learner');
  await app.navigate('#/profiles');
  await app.click('new-profile');
  assert.equal(app.element('app-dialog').open, true);
  app.element('new-profile-name').value = 'Second learner';
  await app.click('create-profile');
  assert.equal(app.element('app-dialog').open, false);
  assert.equal(app.location.hash, '#/dashboard');
  assert.equal(app.element('profile-name').textContent, 'Second learner');
  assert.equal(app.snapshot().profiles.length, 2);
});

test('blocked browser storage allows an in-memory profile while clearly showing the save failure', async () => {
  const app = openApp({ denyStorage: true });
  assert.ok(app.element('create-profile-form'));
  await app.create('Visit learner');
  assert.equal(app.location.hash, '#/dashboard');
  assert.equal(app.element('profile-name').textContent, 'Visit learner');
  assert.equal(app.element('storage-warning').hidden, false);
  assert.match(app.element('storage-warning').textContent, /not allowing local saving/);
  assert.equal(app.element('save-status').dataset.status, 'error');
  assert.match(app.element('toast').textContent, /not allowing local saving/);
  app.element('learning-notes').value = 'Keep in memory for this visit.';
  await app.document.dispatch('input', { target: app.element('learning-notes') });
  await app.click('save-notes');
  await app.navigate('#/profiles');
  await app.navigate('#/dashboard');
  assert.equal(app.element('learning-notes').value, 'Keep in memory for this visit.');
  assert.equal(app.element('profile-name').textContent, 'Visit learner');
  assert.equal(app.storage.values.size, 0);
  assert.ok(openApp({ storage: app.storage, denyStorage: true }).element('create-profile-form'));
});
