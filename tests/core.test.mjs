import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = {};
vm.runInNewContext(await readFile(new URL('../assets/core.js', import.meta.url), 'utf8'), sandbox);
const core = sandbox.CoachCore;
const plain = value => JSON.parse(JSON.stringify(value));

function session(id, date, overrides = {}) {
  return { id, type: 'speaking', date, seconds: 60, source: 'typed', score: null,
    label: 'Practice', words: 12, detail: '', ...overrides };
}

test('phrase comparison handles punctuation, curly apostrophes, and common contractions', () => {
  const result = core.compareTranscript('I’m ready, Captain!', 'I am ready captain.');
  assert.equal(result.score, 100);
  assert.equal(result.matched, 4);
  assert.equal(result.total, 4);
  assert.deepEqual(plain(result.missing), []);
  assert.equal(core.compareTranscript('We cannot leave.', "We can't leave").score, 100);
  assert.equal(core.compareTranscript('The constructor is ready.', 'The constructor is ready.').score, 100);
  // A typed contraction still counts as one written word outside phrase matching.
  assert.equal(core.words("I'm ready.").length, 2);
});

test('comparison penalizes missing, extra, reordered, and empty words', () => {
  const result = core.compareTranscript('Please check the engine.', 'Please check engine now.');
  assert.equal(result.score, 50);
  assert.equal(result.matched, 3);
  assert.deepEqual(plain(result.missing), ['the']);
  assert.deepEqual(plain(result.extra), ['now']);
  assert.ok(core.compareTranscript('Please check the engine', 'Check please the engine').score < 100);
  assert.equal(core.compareTranscript('Hello there', '').score, 0);
  assert.equal(core.compareTranscript('', '').score, 0);
  assert.equal(core.compareTranscript('Hello', 'Goodbye').score, 0);
});

test('numeric transcripts match common whole-number spellings without altering word counts', () => {
  const pairs = [
    ['I work from eight until five.', 'I work from 8 until 5.'],
    ['I noticed a problem near cabin twelve.', 'I noticed a problem near cabin 12.'],
    ['I would like a room for two nights.', 'I would like a room for 2 nights.'],
    ['We have twenty-one people and ninety-nine tickets.', 'We have 21 people and 99 tickets.'],
    ['There are one hundred and five boxes.', 'There are 105 boxes.'],
    ['There are nine hundred ninety-nine boxes.', 'There are 999 boxes.'],
    ['We have zero visitors.', 'We have 0 visitors.']
  ];
  for (const [expected, actual] of pairs) {
    assert.equal(core.compareTranscript(expected, actual).score, 100, actual);
    assert.equal(core.compareTranscript(actual, expected).score, 100, expected);
  }
  assert.equal(core.words('We have 21 people.').length, 4);
  assert.equal(core.analyzeResponse('We have 21 people.').wordCount, 4);
  assert.equal(core.normalizeText('Meet at 3:30.'), 'meet at 3 30');
});

test('clock transcripts match literal spoken time and optional o’clock', () => {
  const pairs = [
    ['The ship leaves at three thirty.', 'The ship leaves at 3:30.'],
    ['I noticed it at nine twenty.', 'I noticed it at 09:20.'],
    ['Please meet me at eight.', 'Please meet me at 8:00.'],
    ['Please meet me at eight o’clock.', 'Please meet me at 08:00.'],
    ['Please meet me at eight o clock.', 'Please meet me at 8:00.'],
    ['Please meet me at nine oh five.', 'Please meet me at 09:05.'],
    ['Please meet me at nine zero five.', 'Please meet me at 09:05.'],
    ['We leave at twenty-three forty-five.', 'We leave at 23:45.']
  ];
  for (const [expected, actual] of pairs) {
    assert.equal(core.compareTranscript(expected, actual).score, 100, actual);
    assert.equal(core.compareTranscript(actual, expected).score, 100, expected);
  }
});

test('numeric matching does not guess identifiers, decimals, dates, or 12/24-hour conversion', () => {
  const different = [
    ['We leave at three thirty.', 'We leave at 15:30.'],
    ['We leave at three thirty.', 'We leave at 3:31.'],
    ['We leave at three thirty.', 'We leave at 3:99.'],
    ['Check cabin twelve.', 'Check cabin 20.'],
    ['Check cabin twelve.', 'Check cabin 012.'],
    ['The result is minus five.', 'The result is -5.'],
    ['The value is three point five.', 'The value is 3.5.'],
    ['This is the first task.', 'This is the 1st task.']
  ];
  for (const [expected, actual] of different) {
    assert.ok(core.compareTranscript(expected, actual).score < 100, actual);
  }
});

test('oversized attempts are bounded and cannot hide extra words beyond the matrix limit', () => {
  const result = core.compareTranscript('Please help me', 'Please help me ' + 'extra '.repeat(1200));
  assert.ok(result.score >= 0 && result.score < 1);
  assert.equal(result.matched, 3);
  assert.equal(result.extra.length, 1200);
});

test('basic feedback matches whole phrases and reports only text-based evidence', () => {
  const result = core.analyzeResponse('I am a captain. I can explain the plan.', ['can', 'plan', 'please', 'can', null]);
  assert.equal(result.wordCount, 9);
  assert.equal(result.uniqueWords, 8);
  assert.equal(result.targetTotal, 3);
  assert.deepEqual(plain(result.targetHits), ['can', 'plan']);
  assert.match(result.suggestion, /please/);
  assert.deepEqual(plain(core.analyzeResponse('captain', ['can']).targetHits), []);
  assert.match(core.analyzeResponse('I is a student.').notes[0], /I am/);
  assert.equal(core.analyzeResponse('  ').wordCount, 0);
  assert.equal('score' in result, false);
});

test('malformed import roots and unsupported schemas are rejected', () => {
  for (const value of [null, [], 'progress', 42, new Date(), { version: 2 }, { sessions: {} }, { profile: [] }, { completedLessons: {} }]) {
    assert.throws(() => core.normalizeState(value));
  }
});

test('normalization removes secrets, validates timestamps, bounds fields, and deduplicates sessions', () => {
  const good = session('real-1', '2026-11-05T08:00:00Z', { seconds: 9999, score: 120, words: -3, secret: 'do-not-copy' });
  const result = core.normalizeState({
    version: 1, profile: { name: '  Mina\n Lee  ', level: 'C9', goalMinutes: 0, accent: 'other', rate: 99, apiKey: 'do-not-copy' },
    completedLessons: ['intro', 'intro', '<unsafe>', 'travel'], notes: 'n'.repeat(25000),
    apiKey: 'do-not-copy', endpoint: 'https://example.invalid',
    sessions: [good, { ...good }, session('bad-date', '2026-02-30T08:00:00Z'),
      session('bad-seconds', '2026-11-05T08:00:00Z', { seconds: -1 }),
      session('bad-type', '2026-11-05T08:00:00Z', { type: 'fake' }), null]
  });
  assert.equal(result.profile.name, 'Mina Lee');
  assert.equal(result.profile.level, 'A2');
  assert.equal(result.profile.goalMinutes, 10);
  assert.equal(result.profile.accent, 'en-US');
  assert.equal(result.profile.rate, 1.2);
  assert.equal(result.sessions.length, 1);
  assert.equal(result.sessions[0].seconds, 3600);
  assert.equal(result.sessions[0].score, 100);
  assert.equal(result.sessions[0].words, 0);
  assert.equal(result.sessions[0].date, '2026-11-05T08:00:00.000Z');
  assert.deepEqual(plain(result.completedLessons), ['intro', 'travel']);
  assert.equal(result.notes.length, 20000);
  assert.ok(!JSON.stringify(result).includes('do-not-copy'));
});

test('progress retains the newest 1000 activities and each new state is independent', () => {
  const sessions = Array.from({ length: 1100 }, (_, i) => session(`session-${i}`, new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString()));
  const result = core.normalizeState({ sessions: sessions.reverse() });
  assert.equal(result.sessions.length, 1000);
  assert.equal(result.sessions[0].id, 'session-100');
  assert.equal(result.sessions.at(-1).id, 'session-1099');
  const first = core.newState(), second = core.newState();
  first.profile.name = 'Changed';
  first.sessions.push(sessions[0]);
  assert.equal(second.profile.name, 'Learner');
  assert.equal(second.sessions.length, 0);
});

test('calendar dates and streaks survive midnight and daylight-saving changes', () => {
  const previousTZ = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    assert.equal(core.localDateKey('2026-11-06T00:30:00Z'), '2026-11-05');
    const state = core.newState();
    state.sessions = [
      session('before-dst', '2026-03-07T17:00:00Z'),
      session('dst-day', '2026-03-08T16:00:00Z'),
      session('after-dst', '2026-03-09T16:00:00Z')
    ];
    const result = core.metrics(state, new Date('2026-03-09T20:00:00Z'));
    assert.equal(result.streak, 3);
    assert.equal(result.weekly.length, 7);
    assert.equal(result.weekly.at(-1).key, '2026-03-09');
    assert.equal(result.weekly.reduce((sum, day) => sum + day.seconds, 0), 180);
    assert.equal(core.metrics(state, new Date('2026-03-10T13:00:00Z')).streak, 3);
    assert.equal(core.metrics(state, new Date('2026-03-11T13:00:00Z')).streak, 0);
    assert.equal(core.metrics(state, new Date('2026-03-11T13:00:00Z'))
      .badges.find(badge => badge.id === 'three-days').earned, true);
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test('metrics use real duration, include zero quiz scores, and ignore unfinished or future activities', () => {
  const state = core.newState();
  state.completedLessons = ['intro', 'intro'];
  state.sessions = [
    session('quiz-zero', '2026-11-05T08:00:00Z', { type: 'quiz', score: 0, seconds: 60 }),
    session('quiz-eighty', '2026-11-05T08:02:00Z', { type: 'quiz', score: 80, seconds: 120 }),
    session('not-finished', '2026-11-05T08:03:00Z', { type: 'quiz', score: 100, seconds: 0, source: 'microphone' }),
    session('future', '2026-11-06T08:00:00Z', { seconds: 3600, source: 'microphone' })
  ];
  const result = core.metrics(state, new Date('2026-11-05T08:10:00Z'));
  assert.equal(result.sessionCount, 2);
  assert.equal(result.totalMinutes, 3);
  assert.equal(result.todaySeconds, 180);
  assert.equal(result.quizAverage, 40);
  assert.equal(result.completedCount, 1);
  assert.equal(result.streak, 1);
  assert.equal(result.badges.find(badge => badge.id === 'quiz-eighty').earned, true);
  assert.equal(result.badges.find(badge => badge.id === 'microphone').earned, false);
  assert.equal(result.badges.find(badge => badge.id === 'one-hour').earned, false);
  assert.equal(core.metrics(core.newState()).quizAverage, null);
});
