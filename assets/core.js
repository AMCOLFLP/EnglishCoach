/* English Speaking Coach — dependency-free practice and progress utilities. */
(function () {
  'use strict';

  const VERSION = 1;
  const MAX_SESSIONS = 1000;
  const MAX_COMPARE_WORDS = 500;
  const TYPES = new Set(['speaking', 'conversation', 'pronunciation', 'quiz', 'lesson']);
  const SOURCES = new Set(['typed', 'microphone', 'activity']);
  const DEFAULT_PROFILE = Object.freeze({
    name: 'Learner', level: 'A2', goalMinutes: 10,
    accent: 'en-US', showThai: false, rate: 0.9
  });
  const CONTRACTIONS = Object.freeze({
    "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
    "it's": 'it is', "he's": 'he is', "she's": 'she is', "that's": 'that is',
    "there's": 'there is', "here's": 'here is', "what's": 'what is',
    "who's": 'who is', "where's": 'where is', "how's": 'how is',
    "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
    "i'll": 'i will', "you'll": 'you will', "he'll": 'he will', "she'll": 'she will',
    "it'll": 'it will', "we'll": 'we will', "they'll": 'they will',
    "i'd": 'i would', "you'd": 'you would', "he'd": 'he would', "she'd": 'she would',
    "we'd": 'we would', "they'd": 'they would',
    "can't": 'can not', cannot: 'can not', "won't": 'will not', "shan't": 'shall not',
    "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
    "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
    "haven't": 'have not', "hasn't": 'has not', "hadn't": 'had not',
    "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not',
    "mustn't": 'must not', "needn't": 'need not', "let's": 'let us'
  });

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      && Object.prototype.toString.call(value) === '[object Object]';
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function cleanString(value, limit, fallback = '') {
    if (typeof value !== 'string') return fallback;
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .slice(0, limit);
  }

  /** Normalized spelling only; this does not assess a learner's pronunciation. */
  function normalizeText(value) {
    if (typeof value !== 'string') return '';
    return (value.slice(0, 30000).normalize('NFKC').toLowerCase()
      .replace(/[\u2018\u2019\u02BC\uFF07]/g, "'")
      .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) || []).join(' ');
  }

  function words(value) {
    const normalized = normalizeText(value);
    return normalized ? normalized.split(' ') : [];
  }

  // The common teaching forms below make "I'm" and "I am" comparable.
  // Ambiguous contractions use their ordinary beginner-course expansion;
  // this is not semantic understanding or a language-proficiency assessment.
  function comparisonWords(value) {
    return words(value).flatMap(word => (Object.prototype.hasOwnProperty.call(CONTRACTIONS, word)
      ? CONTRACTIONS[word] : word).split(' '));
  }

  const SMALL_NUMBERS = Object.freeze(['zero', 'one', 'two', 'three', 'four', 'five',
    'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
    'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']);
  const TENS = Object.freeze(['', '', 'twenty', 'thirty', 'forty', 'fifty',
    'sixty', 'seventy', 'eighty', 'ninety']);
  const NUMBER_WORDS = new Set([...SMALL_NUMBERS, ...TENS.filter(Boolean)]);

  function smallNumberText(number) {
    if (number < 20) return SMALL_NUMBERS[number];
    if (number < 100) return TENS[Math.floor(number / 10)]
      + (number % 10 ? ' ' + SMALL_NUMBERS[number % 10] : '');
    return SMALL_NUMBERS[Math.floor(number / 100)] + ' hundred'
      + (number % 100 ? ' ' + smallNumberText(number % 100) : '');
  }

  function hourBefore(tokens, index) {
    const last = tokens[index - 1], previous = tokens[index - 2];
    if (previous === 'twenty') return ['one', 'two', 'three'].includes(last);
    if (previous === 'hundred' || TENS.slice(3).includes(previous)) return false;
    return SMALL_NUMBERS.includes(last) || last === 'twenty';
  }

  /**
   * Numeric spelling normalization is deliberately restricted to transcript
   * comparisons, so written-word counts and basic response feedback stay intact.
   * Rules: standalone integers 0–999; literal valid 00:00–23:59 clock forms;
   * :01–:09 become “oh one”–“oh nine”; :00 has an optional “o'clock” marker.
   * “One hundred and five” and “one hundred five” are the same number here.
   * Do not infer 12/24-hour conversion, dates, decimals, negative values, ordinals,
   * leading-zero identifiers, telephone-number groupings, or “quarter past” forms.
   */
  function transcriptWords(value) {
    if (typeof value !== 'string') return [];
    let text = value.slice(0, 30000).normalize('NFKC');
    text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, (whole, hour, minute, offset, source) => {
      const before = source[offset - 1] || '';
      const after = source[offset + whole.length] || '';
      if (Number(hour) > 23 || Number(minute) > 59
          || /[\p{L}\p{N}_.:+\/-]/u.test(before) || /[\p{L}\p{N}_:\/]/u.test(after)) return whole;
      const hourText = smallNumberText(Number(hour));
      const minutes = Number(minute);
      if (!minutes) return hourText;
      return hourText + (minutes < 10 ? ' oh ' : ' ') + smallNumberText(minutes);
    });
    text = text.replace(/\b\d{1,3}\b/g, (whole, offset, source) => {
      const before = source[offset - 1] || '';
      const after = source[offset + whole.length] || '';
      if ((whole.length > 1 && whole[0] === '0')
          || /[\p{L}\p{N}_:+\/-]/u.test(before) || /[\p{L}\p{N}_:\/]/u.test(after)
          || ((before === '.' || before === ',') && /\d/.test(source[offset - 2] || ''))
          || ((after === '.' || after === ',') && /\d/.test(source[offset + whole.length + 1] || ''))) return whole;
      return smallNumberText(Number(whole));
    });
    const tokens = comparisonWords(text);
    const result = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === 'and' && tokens[i - 1] === 'hundred' && NUMBER_WORDS.has(tokens[i + 1])) continue;
      if (hourBefore(tokens, i)) {
        if (token === "o'clock") continue;
        if (token === 'o' && tokens[i + 1] === 'clock') { i++; continue; }
        if (token === 'zero' && SMALL_NUMBERS.slice(1, 10).includes(tokens[i + 1])) {
          result.push('oh'); continue;
        }
      }
      result.push(token);
    }
    return result;
  }

  /**
   * Word-level Levenshtein comparison. Insertions and word-order changes count.
   * Empty attempts score 0. At most 500 words per side use the dynamic-programming
   * matrix; longer tails count as unmatched so oversized input cannot inflate a score.
   */
  function compareTranscript(expected, actual) {
    const expectedAll = transcriptWords(expected);
    const actualAll = transcriptWords(actual);
    const expectedWords = expectedAll.slice(0, MAX_COMPARE_WORDS);
    const actualWords = actualAll.slice(0, MAX_COMPARE_WORDS);
    const n = expectedWords.length;
    const m = actualWords.length;
    if (!n || !m) {
      return { score: 0, matched: 0, total: expectedAll.length,
        missing: expectedAll.slice(), extra: actualAll.slice() };
    }
    const width = m + 1;
    const distance = new Uint16Array((n + 1) * width);
    // Among equally short edit paths, preserve the most genuinely matching words.
    // That presents a dropped word plus an extra word more usefully than two substitutions.
    const matchCounts = new Uint16Array((n + 1) * width);
    for (let i = 0; i <= n; i++) distance[i * width] = i;
    for (let j = 0; j <= m; j++) distance[j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const substitution = expectedWords[i - 1] === actualWords[j - 1] ? 0 : 1;
        const cell = i * width + j;
        const diagonal = (i - 1) * width + j - 1;
        let bestDistance = distance[diagonal] + substitution;
        let bestMatches = matchCounts[diagonal] + (substitution === 0 ? 1 : 0);
        for (const adjacent of [(i - 1) * width + j, i * width + j - 1]) {
          const candidateDistance = distance[adjacent] + 1;
          if (candidateDistance < bestDistance
              || (candidateDistance === bestDistance && matchCounts[adjacent] > bestMatches)) {
            bestDistance = candidateDistance;
            bestMatches = matchCounts[adjacent];
          }
        }
        distance[cell] = bestDistance;
        matchCounts[cell] = bestMatches;
      }
    }
    const missing = [];
    const extra = [];
    let i = n, j = m, matched = 0;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && expectedWords[i - 1] === actualWords[j - 1]
          && distance[i * width + j] === distance[(i - 1) * width + j - 1]
          && matchCounts[i * width + j] === matchCounts[(i - 1) * width + j - 1] + 1) {
        matched++; i--; j--;
      } else if (i > 0 && distance[i * width + j] === distance[(i - 1) * width + j] + 1
          && matchCounts[i * width + j] === matchCounts[(i - 1) * width + j]) {
        missing.push(expectedWords[--i]);
      } else if (j > 0 && distance[i * width + j] === distance[i * width + j - 1] + 1
          && matchCounts[i * width + j] === matchCounts[i * width + j - 1]) {
        extra.push(actualWords[--j]);
      } else {
        missing.push(expectedWords[--i]); extra.push(actualWords[--j]);
      }
    }
    missing.reverse(); extra.reverse();
    missing.push(...expectedAll.slice(n));
    extra.push(...actualAll.slice(m));
    const overflow = expectedAll.length - n + actualAll.length - m;
    const errors = distance[n * width + m] + overflow;
    const score = Math.round(100 * (1 - errors / Math.max(expectedAll.length, actualAll.length)));
    return { score: clamp(score, 0, 100), matched, total: expectedAll.length, missing, extra };
  }

  /** Simple, explicitly text-based practice tips, with no invented speaking score. */
  function analyzeResponse(text, targets = []) {
    const tokenList = words(text);
    const canonical = ' ' + comparisonWords(text).join(' ') + ' ';
    const seenTargets = new Set();
    const targetList = (Array.isArray(targets) ? targets : []).slice(0, 30)
      .filter(target => typeof target === 'string')
      .map(target => cleanString(target, 100).trim())
      .filter(target => {
        const normalized = comparisonWords(target).join(' ');
        if (!normalized || seenTargets.has(normalized)) return false;
        seenTargets.add(normalized);
        return true;
      });
    const targetHits = targetList.filter(target =>
      canonical.includes(' ' + comparisonWords(target).join(' ') + ' '));
    const missedTargets = targetList.filter(target => !targetHits.includes(target));
    const notes = [];
    const normalized = normalizeText(text);
    if (!tokenList.length) {
      return { wordCount: 0, uniqueWords: 0, targetHits: [], targetTotal: targetList.length,
        notes: ['Write or say a response before requesting feedback.'],
        suggestion: 'Start with one complete sentence that answers the prompt.' };
    }
    const checks = [
      [/\bi is\b/, 'In the transcript, use “I am” instead of “I is.”'],
      [/\b(?:he|she|it) are\b/, 'For a simple present sentence, use “is” with he, she, or it.'],
      [/\b(?:we|they|you) is\b/, 'For a simple present sentence, use “are” with you, we, or they.'],
      [/\bi am agree\b/, 'To express agreement, say “I agree.”'],
      [/\b(?:i|we|you|they) has\b/, 'Use “have” with I, you, we, or they.'],
      [/\b(?:i|we|you|they) want (?:go|learn|study|buy|travel|work|speak)\b/,
        'Use “want to” before a verb, for example “I want to learn.”']
    ];
    for (const [pattern, tip] of checks) {
      if (pattern.test(normalized)) notes.push(tip);
    }
    if (tokenList.length < 6) notes.push('Add one useful detail to make your message more complete.');
    if (targetList.length) notes.push(`Used ${targetHits.length} of ${targetList.length} target phrases.`);
    if (!notes.length) notes.push('Read your response aloud once and check that it answers the prompt.');
    let suggestion;
    if (notes.some(note => !note.startsWith('Used ') && !note.startsWith('Read ') && !note.startsWith('Add '))) {
      suggestion = notes[0] + ' Check whether the transcript reflects what you intended to say.';
    } else if (missedTargets.length) {
      suggestion = `Try a sentence with “${missedTargets[0]}”, then add one detail or reason.`;
    } else if (tokenList.length < 12) {
      suggestion = 'Extend your answer with a reason using “because”, or add an example.';
    } else {
      suggestion = 'Try saying your answer again without reading, then ask your listener a follow-up question.';
    }
    return { wordCount: tokenList.length, uniqueWords: new Set(tokenList).size,
      targetHits, targetTotal: targetList.length, notes: notes.slice(0, 4), suggestion };
  }

  function newState() {
    return { version: VERSION, profile: { ...DEFAULT_PROFILE }, completedLessons: [], sessions: [], notes: '' };
  }

  function validId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  }

  function isoDate(value) {
    if (typeof value !== 'string') return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
    if (!match) return null;
    const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
    const year = Number(yearText), month = Number(monthText), day = Number(dayText);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]
        || Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  /**
   * Whitelist and bound imported progress. Unknown fields, endpoint settings,
   * credentials, invalid sessions, and duplicate IDs never enter the result.
   * Absent optional fields receive defaults; invalid root/container shapes throw.
   */
  function normalizeState(raw) {
    if (!isRecord(raw)) throw new TypeError('The progress file must contain a JSON object.');
    if (raw.version !== undefined && raw.version !== VERSION) {
      throw new TypeError('This progress file uses an unsupported version.');
    }
    if (raw.profile !== undefined && !isRecord(raw.profile)) throw new TypeError('The progress profile is invalid.');
    if (raw.sessions !== undefined && !Array.isArray(raw.sessions)) throw new TypeError('The progress sessions must be a list.');
    if (raw.completedLessons !== undefined && !Array.isArray(raw.completedLessons)) {
      throw new TypeError('The completed lessons must be a list.');
    }
    const result = newState();
    const profile = raw.profile || {};
    result.profile.name = cleanString(profile.name, 60).replace(/\s+/g, ' ').trim() || DEFAULT_PROFILE.name;
    result.profile.level = ['A1', 'A2', 'B1'].includes(profile.level) ? profile.level : DEFAULT_PROFILE.level;
    result.profile.goalMinutes = [5, 10, 15, 20].includes(profile.goalMinutes) ? profile.goalMinutes : DEFAULT_PROFILE.goalMinutes;
    result.profile.accent = ['en-US', 'en-GB'].includes(profile.accent) ? profile.accent : DEFAULT_PROFILE.accent;
    result.profile.showThai = profile.showThai === true;
    result.profile.rate = typeof profile.rate === 'number' && Number.isFinite(profile.rate)
      ? Math.round(clamp(profile.rate, 0.6, 1.2) * 100) / 100 : DEFAULT_PROFILE.rate;
    result.completedLessons = [...new Set((raw.completedLessons || []).filter(validId))].slice(0, 500);
    result.notes = cleanString(raw.notes, 20000);
    const sessionsById = new Map();
    // A file may contain older activity, but a bounded recent window is sufficient.
    for (const item of (raw.sessions || []).slice(-10000)) {
      if (!isRecord(item) || !validId(item.id) || !TYPES.has(item.type)) continue;
      const date = isoDate(item.date);
      if (!date || typeof item.seconds !== 'number' || !Number.isFinite(item.seconds) || item.seconds < 0) continue;
      const session = {
        id: item.id,
        type: item.type,
        date,
        seconds: clamp(Math.floor(item.seconds), 0, 3600),
        score: typeof item.score === 'number' && Number.isFinite(item.score) ? clamp(item.score, 0, 100) : null,
        source: SOURCES.has(item.source) ? item.source : 'activity',
        label: cleanString(item.label, 160).trim() || item.type,
        words: typeof item.words === 'number' && Number.isFinite(item.words) ? clamp(Math.floor(item.words), 0, 10000) : 0,
        detail: cleanString(item.detail, 2000)
      };
      const previous = sessionsById.get(session.id);
      if (!previous || previous.date <= session.date) sessionsById.set(session.id, session);
    }
    result.sessions = [...sessionsById.values()]
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_SESSIONS);
    return result;
  }

  /** Date key in the learner's browser timezone, rather than the UTC date slice. */
  function localDateKey(value = new Date()) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return [String(date.getFullYear()).padStart(4, '0'),
      String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function dayAtOffset(now, offset) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    date.setDate(date.getDate() + offset);
    return date;
  }

  /** Only completed positive-duration activities on/before now contribute. */
  function metrics(raw, now = new Date()) {
    const state = normalizeState(raw);
    const current = new Date(now);
    if (!Number.isFinite(current.getTime())) throw new TypeError('The current date is invalid.');
    const sessions = state.sessions.filter(session => session.seconds > 0
      && new Date(session.date).getTime() <= current.getTime());
    const byDay = new Map();
    let totalSeconds = 0;
    for (const session of sessions) {
      const key = localDateKey(session.date);
      byDay.set(key, (byDay.get(key) || 0) + session.seconds);
      totalSeconds += session.seconds;
    }
    const today = localDateKey(current);
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = dayAtOffset(current, index - 6);
      const key = localDateKey(date);
      return { key, label: date.toLocaleDateString('en-US', { weekday: 'short' }), seconds: byDay.get(key) || 0 };
    });
    let offset = byDay.has(today) ? 0 : -1;
    let streak = 0;
    while (byDay.has(localDateKey(dayAtOffset(current, offset)))) { streak++; offset--; }
    let longestStreak = 0, run = 0, previousKey = '';
    for (const key of [...byDay.keys()].sort()) {
      const previousDay = new Date(key + 'T12:00:00');
      previousDay.setDate(previousDay.getDate() - 1);
      run = previousKey === localDateKey(previousDay) ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
      previousKey = key;
    }
    const completedCount = state.completedLessons.length;
    const quizzes = sessions.filter(session => session.type === 'quiz' && session.score !== null);
    const quizAverage = quizzes.length
      ? Math.round(quizzes.reduce((sum, session) => sum + session.score, 0) / quizzes.length) : null;
    const badges = [
      { id: 'first-practice', title: 'First step', description: 'Complete your first practice activity.', earned: sessions.length > 0 },
      { id: 'first-lesson', title: 'Lesson explorer', description: 'Complete your first lesson.', earned: completedCount >= 1 },
      { id: 'three-lessons', title: 'Keep learning', description: 'Complete three different lessons.', earned: completedCount >= 3 },
      { id: 'microphone', title: 'Speak up', description: 'Save a practice attempt using your microphone.', earned: sessions.some(session => session.source === 'microphone') },
      { id: 'three-days', title: 'Three-day rhythm', description: 'Practise on three consecutive days.', earned: longestStreak >= 3 },
      { id: 'seven-days', title: 'A week of practice', description: 'Practise on seven consecutive days.', earned: longestStreak >= 7 },
      { id: 'quiz-eighty', title: 'Quiz milestone', description: 'Score at least 80% on a completed quiz.', earned: quizzes.some(session => session.score >= 80) },
      { id: 'one-hour', title: 'An hour invested', description: 'Complete a total of 60 minutes of practice.', earned: totalSeconds >= 3600 }
    ];
    return { sessionCount: sessions.length, totalMinutes: Math.round(totalSeconds / 6) / 10,
      todaySeconds: byDay.get(today) || 0, streak, completedCount, quizAverage, weekly, badges };
  }

  const api = Object.freeze({ normalizeText, words, compareTranscript, analyzeResponse,
    normalizeState, newState, localDateKey, metrics });
  globalThis.CoachCore = api;
  if (typeof window !== 'undefined') window.CoachCore = api;
})();
