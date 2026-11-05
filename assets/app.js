/* English AI Speaking Coach — buildless, dependency-free browser application. */
(() => {
  'use strict';
  const C = window.CoachContent;
  const K = window.CoachCore;
  const S = window.CoachStorage;
  const D = window.CoachDevice;
  const cfg = window.COACH_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const categoryNames = {everyday:'Everyday English',travel:'Travel & exploring',work:'Work & study',maritime:'Maritime English'};
  const categoryIcons = {everyday:'chat',travel:'plane',work:'case',maritime:'anchor'};
  const titleNames = {home:'Overview',lessons:'Lessons',practice:'Speaking practice',conversation:'Conversation',pronunciation:'Pronunciation',dashboard:'My progress',quiz:'Knowledge quiz',leaderboard:'Leaderboard & badges',profiles:'Learner profiles',device:'Saved on this device',features:'Explore the coach',about:'About the coach',contact:'Help & privacy'};
  const thaiTitles = {home:'พื้นที่ฝึกภาษาอังกฤษของคุณ',lessons:'บทเรียนภาษาอังกฤษ',practice:'ฝึกพูดภาษาอังกฤษ',conversation:'ฝึกสนทนาในสถานการณ์จริง',pronunciation:'ฝึกฟังและออกเสียง',dashboard:'ติดตามความก้าวหน้า',quiz:'แบบทดสอบความรู้',leaderboard:'อันดับในอุปกรณ์นี้และเหรียญรางวัล',profiles:'โปรไฟล์ผู้เรียนในเบราว์เซอร์นี้',device:'บันทึกความก้าวหน้าในอุปกรณ์นี้',features:'คู่มือฟังก์ชันภาษาอังกฤษและภาษาไทย',about:'เกี่ยวกับเว็บไซต์',contact:'ความช่วยเหลือและความเป็นส่วนตัว'};
  if (!C || !K || !S) {
    $('main').innerHTML = '<div class="empty-state"><h1>Some app files are missing</h1><p>Upload index.html and the complete assets folder together, then reload. The standalone HTML edition is also available in the project package.</p></div>';
    return;
  }
  let browserStorage;
  try { browserStorage = window.localStorage; } catch {}
  const deviceStore = S.create({storage:browserStorage, namespace:new URL('./',location.href).pathname.slice(0,200)});
  const initial = deviceStore.load();
  let state = initial.state, activeProfileId = initial.activeProfileId;
  let storageStatus = initial.status, storageOK = initial.status.ok;
  let stateDirty = false, notesDirty = false, autosaveTimer = null, externalChanged = false;
  const pendingDrafts = new Map();
  let route = {page:'home',id:''};
  let filter = 'all', search = '';
  let toastTimer, speech, recognition, recording = false, recognitionTicket = 0, recognitionStopTimer;
  let aiAbort = null, aiEnabled = false, aiToken = '';
  let routeTicket = 0;
  let menuInvoker = null;
  let focusAfterRoute = null;
  const mobileLayout = window.matchMedia('(max-width: 1024px)');
  let practiceContext = null, pronunciationContext = null, conversation = null, quiz = null;
  let clock = {seconds:0,last:performance.now(),interaction:performance.now(),enabled:false};
  const makeID = () => globalThis.crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const getLesson = (id) => C.lessons.find(l => l.id === id);
  const currentLesson = () => getLesson(route.id) || C.lessons.find(l => l.level === state.profile.level) || C.lessons[0];
  const notice = (text, kind = '') => `<div class="notice ${kind}" role="status">${icon('info')}<span>${text}</span></div>`;
  const btn = (text, action, type = '', extra = '') => `<button class="btn ${type}" data-action="${action}" ${extra}>${text}</button>`;
  const link = (text, href, type='') => `<a class="btn ${type}" href="${href}">${text}</a>`;

  function persist() {
    state = K.normalizeState(state);
    stateDirty = true;
    setStorageStatus(deviceStore.save(state));
    if(storageOK) { stateDirty=false; notesDirty=false; }
    updateShell();
    return storageOK;
  }
  function setStorageStatus(status) { storageStatus=status; storageOK=!!status.ok; updateShell(); }
  function storageMessage() {
    const messages = {
      'storage-unavailable':'This browser is not allowing local saving. Keep this page open and export your progress.',
      'read-failed':'Saved data could not be read. Keep your current work and export a backup before reloading.',
      'quota-exceeded':'Browser storage is full. Export a backup, free some space, then retry saving.',
      'write-failed':'Your latest changes could not be saved. Keep this page open, export a backup, and try again.',
      'corrupt-data':'The stored progress could not be read safely. It has been preserved. Export this session before choosing a recovery option.',
      'unsupported-version':'This browser has data from a newer app version. Open the latest app before saving.',
      'conflict':'This profile was changed in another tab. Export your current work, then reload the latest saved copy.',
      'profile-limit':`This browser already has ${S.MAX_PROFILES} learner profiles. Choose an existing profile or remove one.`,
      'profile-not-found':'That profile is no longer available. Reload the latest saved profiles.',
      'last-profile':'Keep at least one learner profile. You can reset its progress instead.'
    };
    return messages[storageStatus.error] || 'Your latest changes are not saved yet. Export a backup or retry saving.';
  }
  function showThaiGuide() { return deviceStore.getPreference('showThaiGuide') !== false; }
  function thaiGuide(text, cls='') { return `<p class="thai-guide ${cls}" lang="th" data-thai-guide ${showThaiGuide()?'':'hidden'}>${esc(text)}</p>`; }
  function savedTime() {
    return storageStatus.savedAt ? new Intl.DateTimeFormat('en',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(storageStatus.savedAt)) : 'No saved copy yet';
  }
  function queueDraft(kind,value) {
    const id=kind==='practice'?practiceContext?.lessonId:pronunciationContext?.item.id;
    if(!id) return;
    pendingDrafts.set(`${kind}:${id}`,value);
    scheduleAutosave();
  }
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer=setTimeout(flushAutosave,400);
    updateShell();
  }
  function draftFor(key) { return pendingDrafts.has(key)?pendingDrafts.get(key):deviceStore.getDraft(key); }
  function flushAutosave() {
    clearTimeout(autosaveTimer); autosaveTimer=null;
    if((stateDirty||notesDirty) && !persist()) return false;
    for(const [key,value] of pendingDrafts) {
      setStorageStatus(deviceStore.setDraft(key,value));
      if(!storageOK) return false;
      pendingDrafts.delete(key);
    }
    updateShell();
    return storageOK;
  }
  function clearDraft(key) {
    pendingDrafts.delete(key);
    setStorageStatus(deviceStore.clearDraft(key));
    return storageOK;
  }
  function completionToast(text) { toast(storageOK?text:'Activity completed for this visit. Saving needs attention—export a backup before closing.'); }
  function rememberRoute(page,id) {
    if(!['practice','pronunciation','lessons'].includes(page) || !id || !storageOK) return;
    const hash=`#/${page}/${encodeURIComponent(id)}`;
    if(deviceStore.getPreference('lastRoute')!==hash) setStorageStatus(deviceStore.setPreference('lastRoute',hash));
  }
  function toast(text) {
    clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function updateShell() {
    $('profile-name').textContent = state.profile.name;
    $('profile-initial').textContent = state.profile.name.charAt(0).toUpperCase() || 'L';
    $('mode-indicator').innerHTML = `<i></i>${aiEnabled ? 'AI mode enabled' : 'Guided mode'}`;
    const pending=!!autosaveTimer||stateDirty||notesDirty||pendingDrafts.size>0;
    const label=storageOK?(pending?'Saving…':'Saved on device'):'Save needs attention';
    const save=$('save-status');
    if(save) { save.innerHTML=`${icon(storageOK?'check':'info')}<span>${label}</span>`; save.dataset.status=storageOK?(pending?'pending':'saved'):'error'; save.setAttribute('aria-label',`${label}. ${storageStatus.savedAt?`Last saved ${savedTime()}. `:''}Open saving and offline settings.`); save.title=storageStatus.savedAt?`Last saved ${savedTime()}`:label; }
    const warning=$('storage-warning');
    warning.hidden=storageOK&&!externalChanged;
    warning.innerHTML=`${icon('info')}<span>${esc(!storageOK?storageMessage():'Saved data changed in another tab. Open device settings to reload the latest copy.')}</span><a href="#/device">Review saving ${icon('arrow')}</a>`;
    const note=$('notes-save-status'); if(note) note.textContent=storageOK?(pending?'Saving your notes…':'Notes save automatically on this device.'):'Notes are in this visit only. Saving needs attention.';
    const count=document.querySelector('.nav-count'); if(count)count.textContent=C.lessons.length;
  }
  function tick() {
    const now = performance.now();
    if(clock.enabled && document.visibilityState === 'visible' && now - clock.interaction < 60000) clock.seconds += Math.min(2, (now-clock.last)/1000);
    clock.last = now;
  }
  function beginClock() { clock = {seconds:0,last:performance.now(),interaction:performance.now(),enabled:true}; }
  function secondsUsed() { tick(); return Math.min(3600, Math.max(1, Math.round(clock.seconds))); }
  setInterval(tick,1000);
  ['pointerdown','keydown','scroll'].forEach(t => document.addEventListener(t, () => { clock.interaction = performance.now(); }, {passive:true}));
  document.addEventListener('visibilitychange', () => { tick(); clock.last = performance.now(); if(document.hidden) {stopMedia();flushAutosave();} });
  function addSession(type,label,options={}) {
    const id = options.id || makeID();
    if(state.sessions.some(s => s.id === id)) return false;
    state.sessions.push({id,type,label,date:new Date().toISOString(),seconds:options.seconds ?? secondsUsed(),score:options.score ?? null,source:options.source || 'activity',words:options.words || 0,detail:options.detail || ''});
    persist(); return true;
  }
  function closeMenu(focus=false) {
    const wasOpen = $('sidebar').classList.contains('open');
    $('sidebar').classList.remove('open'); $('nav-shade').hidden = true;
    document.body.classList.remove('nav-open');
    document.querySelector('.workspace').inert = false;
    $('mobile-navigation').inert = false;
    $('sidebar').removeAttribute('role'); $('sidebar').removeAttribute('aria-modal');
    $('menu-button').setAttribute('aria-expanded','false'); $('menu-button').setAttribute('aria-label','Open navigation');
    $('more-button').setAttribute('aria-expanded','false'); $('more-button').setAttribute('aria-label','Open more navigation');
    if(focus && wasOpen) {
      const target = menuInvoker?.isConnected && menuInvoker.getClientRects().length ? menuInvoker : (mobileLayout.matches ? $('menu-button') : $('main'));
      target.focus();
    }
  }
  function toggleMenu(event) {
    if(!mobileLayout.matches) return;
    if($('sidebar').classList.contains('open')) { closeMenu(true); return; }
    menuInvoker = event?.currentTarget || $('menu-button');
    $('sidebar').classList.add('open'); $('nav-shade').hidden = false;
    document.body.classList.add('nav-open');
    $('sidebar').setAttribute('role','dialog'); $('sidebar').setAttribute('aria-modal','true');
    $('menu-button').setAttribute('aria-expanded','true'); $('menu-button').setAttribute('aria-label','Close navigation');
    $('more-button').setAttribute('aria-expanded','true'); $('more-button').setAttribute('aria-label','Close more navigation');
    document.querySelector('.workspace').inert = true;
    $('mobile-navigation').inert = true;
    requestAnimationFrame(()=>{
      if($('sidebar').classList.contains('open')) ($('sidebar').querySelector('a.active') || $('nav-close')).focus();
    });
  }
  function closeDialog() { $('app-dialog').close(); }
  function showDialog(title,body,footer='') {
    closeMenu();
    stopMedia();
    if (!$('app-dialog').open) {
      tick(); $('app-dialog')._resumeClock = {ticket:routeTicket,enabled:clock.enabled}; clock.enabled = false;
    }
    $('dialog-content').innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${esc(title)}</h2><button class="icon-btn" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div class="dialog-body">${body}</div>${footer ? `<div class="dialog-footer">${footer}</div>`:''}`;
    if(!$('app-dialog').open) $('app-dialog').showModal();
  }
  function pageHeading(title,subtitle,extra='') {
    return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p>${thaiTitles[route.page]?thaiGuide(thaiTitles[route.page],'thai-heading'):''}</div>${extra}</div>`;
  }
  function heroArt() {
    return `<div class="hero-art" aria-hidden="true"><div class="voice-orbit"><span class="orbit-dot"></span><div class="voice-disc"><svg viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 28v8m10-18v28m10-34v40m10-45v50m10-38v26m10-33v40m10-31v22m10-29v36m10-23v10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></div></div><span class="voice-bubble">Hello, world.</span><span class="voice-bubble small">One small step, every day.</span><span class="voice-caption">YOUR NEXT CONVERSATION STARTS HERE</span></div>`;
  }
  function lessonCard(l, compact=false) {
    const complete = state.completedLessons.includes(l.id);
    return `<article class="lesson-card"><div class="lesson-art ${esc(l.category)}"><span class="level-chip">${esc(l.level)}${compact?'':` · ${l.level==='A1'?'Beginner':l.level==='A2'?'Elementary':'Intermediate'}`}</span>${icon(categoryIcons[l.category] || 'book','category-illustration')}</div><div class="lesson-body"><span class="lesson-category">${esc(categoryNames[l.category] || l.category)}</span><h3>${esc(l.title)}</h3><p>${esc(l.description)}</p><div class="lesson-meta"><span>${icon('clock')}${l.minutes} min</span><a href="#/lessons/${encodeURIComponent(l.id)}">${complete?'Review lesson':'Start lesson'} ${icon(complete?'check':'arrow')}</a></div></div></article>`;
  }
  function stats(m) {
    return `<div class="quick-stats"><div class="stat"><div class="stat-symbol gold">${icon('spark')}</div><div><strong>${m.streak}<small>${m.streak===1?'day':'days'}</small></strong><p>Current streak</p></div></div><div class="stat"><div class="stat-symbol">${icon('clock')}</div><div><strong>${m.totalMinutes}<small>min</small></strong><p>Practice completed</p></div></div><div class="stat"><div class="stat-symbol lilac">${icon('book')}</div><div><strong>${m.completedCount}<small>/ ${C.lessons.length}</small></strong><p>Lessons completed</p></div></div><div class="stat"><div class="stat-symbol blue">${icon('chat')}</div><div><strong>${m.sessionCount}</strong><p>Learning activities</p></div></div></div>`;
  }
  function homeSavingCard() {
    const resume=deviceStore.getPreference('lastRoute');
    const parts=(resume||'').split('/');
    const hasDraft=resume && ['practice','pronunciation'].includes(parts[1]) && draftFor(`${parts[1]}:${parts[2]}`);
    return `<section class="continue-strip"><span class="continue-icon">${icon('device')}</span><div><strong>${storageOK?'Your next visit starts here.':'Keep a copy of your progress.'}</strong><p>${hasDraft?'An unfinished response is waiting for you.':storageOK?'Progress, notes and practice drafts save in this browser.':esc(storageMessage())}</p></div><div class="actions">${hasDraft?link(`Continue your draft ${icon('arrow')}`,resume,'secondary small'):link('Explore the coach','#/features','secondary small')}${link('Saving & backups','#/device','text-button small')}</div></section>`;
  }
  function validAIScores(scores) {
    const keys=['task','clarity','grammar','vocabulary'];
    return scores!==null && typeof scores==='object' && !Array.isArray(scores) && Object.keys(scores).length===4 && keys.every(key=>Number.isInteger(scores[key])&&scores[key]>=0&&scores[key]<=5);
  }
  function aiScoreCard(scores) {
    if(!validAIScores(scores)) return '';
    const total=5*Object.values(scores).reduce((sum,n)=>sum+n,0);
    return `<section class="ai-score"><div class="ai-score-heading"><div><span class="eyebrow">AI TEXT REVIEW</span><h4>A guide for your next attempt</h4></div><strong>${total}<small> / 100</small></strong></div><div class="rubric-grid">${[['task','Task relevance'],['clarity','Clarity'],['grammar','Grammar'],['vocabulary','Vocabulary']].map(([key,label])=>`<div class="rubric-item"><div><span>${label}</span><strong>${scores[key]} / 5</strong></div><meter min="0" max="5" value="${scores[key]}" aria-label="${label}">${scores[key]} out of 5</meter></div>`).join('')}</div><p class="note">AI ratings describe your submitted text. They are formative feedback, not a validated English level, pronunciation or fluency score.</p></section>`;
  }
  function home() {
    const m = K.metrics(state);
    const fresh = !m.sessionCount;
    const candidates = [...C.lessons.filter(l => !state.completedLessons.includes(l.id)),...C.lessons.filter(l=>state.completedLessons.includes(l.id))];
    let chosen = [];
    ['everyday','travel','work'].forEach(cat => { const l = candidates.find(x=>x.category===cat); if(l) chosen.push(l); });
    const today = K.localDateKey(new Date());
    const percent = Math.min(100, Math.round(m.todaySeconds/(state.profile.goalMinutes*60)*100));
    const date = new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric'}).format(new Date());
    return `${pageHeading(fresh?'Let’s make progress.':`Keep going, ${state.profile.name}.`,fresh?'A little English. A lot more confidence.':'Every conversation is another step forward.',`<span class="today-pill">${icon('clock')} ${esc(date)}</span>`)}
      <section class="hero"><div class="hero-copy"><span class="hero-label"><span></span>A LITTLE PRACTICE. EVERY DAY.</span><h2>Find your voice.<br><em>Make it a habit.</em></h2><p>Real-life lessons. Space to try. Build the confidence to speak English, one conversation at a time.</p><div class="actions">${link(`${icon('mic')} Start speaking`,'#/practice','large')}${link(`View lessons ${icon('arrow')}`,'#/lessons','ghost')}</div></div>${heroArt()}</section>
      ${stats(m)}
      ${homeSavingCard()}
      <div class="home-columns"><section><div class="section-heading"><div><h2>${fresh?'Start with something useful':'Keep your momentum'}</h2><p>Useful English for the moments that matter.</p></div><a class="text-link" href="#/lessons">All lessons ${icon('arrow')}</a></div><div class="lesson-grid">${chosen.map(l=>lessonCard(l,true)).join('')}</div></section><aside><div class="panel goal-panel"><div class="goal-head"><h3>Your daily goal</h3>${icon('star')}</div><div class="goal-dial" role="progressbar" aria-label="Daily practice goal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${Math.floor(m.todaySeconds/60)} of ${state.profile.goalMinutes} minutes completed today" style="--progress:${percent}"><div><strong>${Math.floor(m.todaySeconds/60)}<span> / ${state.profile.goalMinutes} min</span></strong><span>of practice today</span></div></div><p>${percent>=100?'You made time for your English today. Nicely done.':'A few focused minutes can become a great habit.'}</p><div class="mini-week" aria-label="Practice over the last seven days">${m.weekly.map(d=>`<span class="${d.seconds>0?'done':''} ${d.key===today?'current':''}" title="${esc(d.key)}: ${Math.floor(d.seconds/60)} minutes">${esc(d.label).charAt(0)}</span>`).join('')}</div><div class="goal-adjust"><button class="text-link" data-action="settings">Adjust your goal ${icon('arrow')}</button></div></div><div class="tip-card">${icon('info')}<div><strong>A friendly reminder</strong><p>You don’t need perfect English to have a good conversation. Start with what you know.</p></div></div></aside></div>
      <div class="section-heading"><h2>How would you like to practise?</h2></div><div class="path-grid"><a class="path-card" href="#/conversation">${icon('chat')}<div><h3>Try a conversation</h3><p>Real-life situations, one turn at a time.</p></div></a><a class="path-card" href="#/pronunciation">${icon('sound')}<div><h3>Listen, then say it</h3><p>Slow down and practise a useful phrase.</p></div></a><a class="path-card" href="#/quiz">${icon('quiz')}<div><h3>Check your knowledge</h3><p>A short quiz with helpful explanations.</p></div></a></div>`;
  }
  function lessons() {
    if(route.id && getLesson(route.id)) return lessonDetail(getLesson(route.id));
    return `${pageHeading('A little learning. A lot of possibilities.',`${C.lessons.length} practical lessons for everyday life, work, travel and the sea.`)}<div class="toolbar"><div class="filters" aria-label="Filter lessons">${[['all','All lessons'],['everyday','Everyday'],['travel','Travel'],['work','Work & study'],['maritime','Maritime']].map(([key,text])=>`<button class="filter ${filter===key?'active':''}" data-action="filter" data-value="${key}" aria-pressed="${filter===key}">${text}</button>`).join('')}</div><div class="search-field">${icon('search')}<label class="sr-only" for="lesson-search">Search lessons</label><input type="search" id="lesson-search" placeholder="Find a topic…" value="${esc(search)}"></div></div><div id="lesson-results">${lessonResults()}</div>`;
  }
  function lessonResults() {
    const selected = C.lessons.filter(l=>(filter==='all'||l.category===filter)&&`${l.title} ${l.description} ${l.category} ${l.level} ${l.id} ${l.vocabulary.map(v=>v.word).join(" ")}`.toLowerCase().includes(search.toLowerCase().trim()));
    if(!selected.length) return `<div class="empty-state">${icon('search')}<h2>No lessons found</h2><p>Try another word, or choose “All lessons”.</p>${btn('Clear search','clear-search','secondary')}</div>`;
    return `<div class="lesson-grid">${selected.map(l=>lessonCard(l)).join('')}</div>`;
  }
  function lessonDetail(l) {
    const done = state.completedLessons.includes(l.id);
    beginClock();
    return `<a class="back-link" href="#/lessons">${icon('arrow')} All lessons</a><header class="lesson-detail-top"><div class="actions"><span class="tag">${esc(l.level)}</span><span class="tag">${esc(categoryNames[l.category])}</span><span class="tag">${icon('clock')}${l.minutes} min suggested</span>${done?'<span class="tag">Completed</span>':''}</div><h1>${esc(l.title)}</h1><p>${esc(l.description)}</p></header><div class="detail-grid"><div class="stack"><section class="panel"><h2>Your learning goal</h2><div class="objective"><p>${esc(l.objective)}</p></div><h3>Words you can use</h3><div class="vocab-grid">${l.vocabulary.map((v,i)=>`<div class="vocab-card"><strong>${esc(v.word)}</strong><p>${esc(v.meaning)}</p><p class="example">“${esc(v.example)}”</p><p class="thai" lang="th" ${state.profile.showThai?'':'hidden'}>${esc(v.thai)}</p><button class="text-link" data-action="speak-vocab" data-id="${esc(l.id)}" data-index="${i}">${icon('sound')} Listen</button></div>`).join('')}</div></section><section class="panel"><div class="section-heading" style="margin:0 0 15px"><h2 style="margin:0">A conversation to try</h2>${btn(`${icon('sound')} Listen`,'listen-dialogue','secondary small',`data-id="${esc(l.id)}"`)}</div><div class="dialogue">${l.dialogue.map(d=>`<div class="dialogue-line"><strong>${esc(d.speaker)}</strong><p>${esc(d.text)}</p></div>`).join('')}</div><p class="note">Work with a partner and swap roles. For solo practice, speak both parts.</p></section><section class="panel"><h2>Now make it your own</h2><ol class="list">${l.tasks.map(t=>`<li>${esc(t)}</li>`).join('')}</ol><div class="actions" style="margin-top:22px">${link(`${icon('mic')} Practise this topic`,`#/practice/${encodeURIComponent(l.id)}`)}${btn('Print lesson','print','secondary')}</div></section></div><aside class="stack"><section class="panel"><h3>Small tips, better conversations</h3><ol class="tips-list">${l.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></section><section class="panel"><h3>Your lesson checklist</h3><p>Complete these steps at your own pace.</p><div style="margin:20px 0">${['I read the words and examples.','I practised the dialogue aloud.','I tried the three tasks.'].map((t,i)=>`<label class="checkbox-label" style="margin-bottom:12px"><input type="checkbox" class="lesson-task" ${done?'checked disabled':''}>${t}</label>`).join('')}</div>${btn(`${icon('check')} ${done?'Lesson completed':'Mark lesson complete'}`,'complete-lesson','',`data-id="${esc(l.id)}" disabled id="complete-lesson"`)}<p class="note">This is your own completion checklist, not a proficiency assessment.</p></section></aside></div>`;
  }
  function practice() {
    const l=currentLesson();
    practiceContext={lessonId:l.id,source:'typed',lastSubmitted:'',pending:false,sessionID:makeID()};
    beginClock();
    return `${pageHeading('Find your voice.','A safe space to try, make a mistake, and try again.')}<div class="practice-grid"><section class="panel"><div class="field"><label for="practice-topic">What would you like to talk about?</label><select id="practice-topic">${C.lessons.map(x=>`<option value="${esc(x.id)}" ${x.id===l.id?'selected':''}>${esc(x.title)} · ${esc(x.level)}</option>`).join('')}</select></div><div class="practice-prompt"><span class="eyebrow">YOUR SPEAKING PROMPT</span><h2>${esc(l.prompt)}</h2><p>Try a few complete sentences. Use your own details for personal questions; keep the facts given in a role-play prompt.</p><p style="margin-top:12px"><strong>Words to try:</strong></p><div class="match-words">${l.targets.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div><div class="record-area"><button class="mic-button" data-action="record-practice" aria-label="Start microphone for your response" id="practice-mic">${icon('mic')}</button><p id="practice-mic-status">Speak your answer, or type below.</p><small>Your browser may send audio to its speech service. Text input always works.</small></div><div class="transcript-head"><label for="practice-text">Your response</label><span id="practice-word-count">${K.words(draftFor(`practice:${l.id}`)).length} words</span></div><textarea id="practice-text" maxlength="3000" placeholder="${esc(l.starter)}">${esc(draftFor(`practice:${l.id}`))}</textarea><p class="draft-note">${icon('device')} Your unfinished response saves automatically on this device.</p><div class="actions" style="margin-top:14px">${btn(`${icon('spark')} ${aiEnabled?'Get AI feedback':'Get practice feedback'}`,'submit-practice','',`id="submit-practice"`)}${btn('Try a sentence starter','starter','secondary small')}${btn('Clear draft','clear-practice','text-button small')}</div><p class="note" id="coach-mode-note">${aiEnabled?'AI feedback is sent to your configured coach. You can edit the transcript before submitting.':'Guided mode offers a basic word and phrase check. It does not grade pronunciation, fluency, or English proficiency.'}</p><div id="practice-feedback" aria-live="polite"></div></section><aside class="stack"><section class="panel"><h3>Make it a conversation</h3><ol class="tips-list"><li>Take a breath and read the prompt.</li><li>Say your main idea first.</li><li>Add one example or a reason.</li><li>Listen back to your words and try again.</li></ol></section><section class="panel"><h3>Need a little inspiration?</h3><details><summary>See a model answer</summary><p>${esc(l.modelAnswer)}</p>${btn(`${icon('sound')} Listen to example`,'speak-model','secondary small')}</details><p class="note">Use the model as a guide. Personalise your own story and keep any supplied scenario facts.</p><a class="text-link" style="margin-top:16px" href="#/lessons/${encodeURIComponent(l.id)}">Review this lesson ${icon('arrow')}</a></section><section class="panel"><h3>Your coach</h3><p id="coach-mode-description">${aiEnabled?'AI mode is enabled for submitted text.':'Guided mode is ready to use without an account.'}</p>${btn(`${icon('settings')} Coach settings`,'settings','secondary small',`style="margin-top:14px"`)}</section></aside></div>`;
  }
  async function submitPractice() {
    const ctx = practiceContext;
    if(!ctx || ctx.pending) return;
    const text=$('practice-text').value.trim(), l=getLesson(ctx.lessonId);
    if(K.words(text).length<3) { toast('Try at least three words so there is something to work with.'); $('practice-text').focus(); return; }
    if(text===ctx.lastSubmitted) { toast(storageOK?'This response is already saved. Change it to practise again.':'This response is already completed for this visit. Review the saving alert.'); return; }
    stopRecognition();
    const feedback=$('practice-feedback');
    const basics=K.analyzeResponse(text,l.targets);
    const ticket=routeTicket;
    const submittedSource=ctx.source, submittedSeconds=secondsUsed();
    ctx.pending=true; clock.enabled=false;
    const freezeAttempt=(freeze)=>{
      for(const id of ['submit-practice','practice-text','practice-mic']) if($(id)) $(id).disabled=freeze;
      const starter=document.querySelector('[data-action="starter"]'); if(starter) starter.disabled=freeze;
    };
    freezeAttempt(true);
    feedback.innerHTML='<div class="busy-indicator" role="status">Preparing your feedback…</div>';
    let response=null;
    if(aiEnabled) {
      try { response=await requestAI({kind:'feedback',text,prompt:l.prompt,level:state.profile.level}); }
      catch(err) { if(ticket!==routeTicket) return; feedback.innerHTML=notice(esc(err.message),'error'); ctx.pending=false; freezeAttempt(false); clock.enabled=true; clock.last=performance.now(); return; }
    }
    if(ticket!==routeTicket) return;
    const score=response?.scores ? 5*Object.values(response.scores).reduce((sum,n)=>sum+n,0) : null;
    addSession('speaking',l.title,{score,source:submittedSource,seconds:submittedSeconds,words:basics.wordCount,detail:response?'AI text feedback':'Guided text practice',id:ctx.sessionID});
    if(storageOK) clearDraft(`practice:${l.id}`);
    ctx.lastSubmitted=text; ctx.lastResponse=text; ctx.sessionID=makeID(); ctx.pending=false;
    freezeAttempt(false);
    feedback.innerHTML=`<div class="feedback-box"><h3>${icon('check')} ${response?'Your AI feedback':'Your practice check-in'}</h3><div class="metric-row"><div class="mini-metric"><strong>${basics.wordCount}</strong><span>words in your response</span></div><div class="mini-metric"><strong>${basics.targetHits.length} / ${basics.targetTotal}</strong><span>suggested words/phrases used</span></div></div>${response?`${aiScoreCard(response.scores)}<p>${esc(response.feedback)}</p><div class="objective"><strong>Try this next</strong><p>${esc(response.suggestion)}</p></div>`:`<ul class="list">${basics.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><div class="objective"><strong>Your next small step</strong><p>${esc(basics.suggestion)}</p></div>`}<p class="note">${storageOK?'Saved as':'Completed for this visit as'} ${submittedSource==='microphone'?'microphone-assisted':'typed'} practice. These checks describe the text, not your pronunciation.</p>${btn(`${icon('sound')} Hear my response`,'listen-response','secondary small')}</div>`;
    beginClock();
    completionToast('Practice saved. Your next attempt is a fresh start.');
  }
  function conversations() {
    const scenario=C.scenarios.find(s=>s.id===route.id);
    if(scenario) return conversationView(scenario);
    return `${pageHeading('A conversation for every day.','Choose a situation. Take a role. See where your words can take you.')}<div class="notice" style="margin-bottom:24px">${icon('info')}<span>${aiEnabled?'AI mode responds to the text you choose to submit.':'Guided mode uses a four-turn role play with planned prompts and examples. Choose AI mode in settings for adaptive responses when a server is configured.'}</span></div><div class="scenario-grid">${C.scenarios.map(s=>`<article class="panel scenario-card"><div class="stat-symbol">${icon(categoryIcons[s.category]||'chat')}</div><span class="tag">${esc(s.level)}</span><h2>${esc(s.title)}</h2><p>${esc(s.description)}</p><p style="margin-top:10px"><strong>Your role:</strong> ${esc(s.role)}</p>${link(`Start conversation ${icon('arrow')}`,`#/conversation/${encodeURIComponent(s.id)}`)}</article>`).join('')}</div>`;
  }
  function conversationView(s) {
    conversation={scenario:s,index:0,messages:[],userTurns:0,pending:false,complete:false,ai:aiEnabled,id:makeID(),hadVoice:false};
    const first=`${s.opening} ${s.turns[0].question}`;
    conversation.messages.push({role:'assistant',content:first});
    beginClock();
    return `<a class="back-link" href="#/conversation">${icon('arrow')} All conversations</a>${pageHeading(s.title,`Your role: ${s.role} · Your partner: ${s.coachRole}`)}<div class="conversation-layout"><section class="chat-box"><div class="chat-toolbar"><div><h2>${esc(s.coachRole)}</h2><p>${conversation.ai?'AI conversation':'Guided role play'} · ${esc(s.level)}</p></div><span class="tag" id="conversation-step">Turn 1 of 4</span></div><div id="messages" class="messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="composer" id="composer"><label for="conversation-text">Your reply</label><textarea id="conversation-text" maxlength="2000" placeholder="Try a reply in your own words…"></textarea><div class="actions"><button class="btn secondary small" id="conversation-mic" data-action="record-conversation">${icon('mic')} Speak</button>${btn(`Send reply ${icon('arrow')}`,'send-conversation','',`id="send-conversation"`)}</div><p id="conversation-mic-status" class="note">Speaking is optional. Your browser’s speech service may process your audio.</p><div id="conversation-error"></div></div></section><aside class="stack"><section class="panel"><h3>Your mission</h3><p>${esc(s.description)}</p><div class="conversation-hint" id="conversation-hint">${esc(s.turns[0].hint)}</div><details id="reply-example"><summary>Need a reply idea?</summary><p id="reply-example-text">${esc(s.turns[0].example)}</p></details><p class="note">Examples are prompts for practice. Use your own details when invited, and keep the facts supplied by the scenario.</p></section><section class="panel"><h3>Keep the conversation going</h3><ol class="tips-list"><li>Reply to your partner’s question.</li><li>Add one useful detail.</li><li>Ask for clarification when you need it.</li></ol>${btn('Restart role play','restart-conversation','secondary small')}</section></aside></div>`;
  }
  function appendMessage(msg,index) {
    const div=document.createElement('div'); div.className=`message ${msg.role==='user'?'user':''}`;
    div.innerHTML=`<div class="message-avatar" aria-hidden="true">${msg.role==='user'?esc(state.profile.name.charAt(0).toUpperCase()):icon('chat')}</div><div class="bubble"><p>${esc(msg.content)}</p>${msg.role==='assistant'?`<button class="text-link" data-action="speak-message" data-index="${index}" aria-label="Listen to coach message">${icon('sound')} Listen</button>`:''}</div>`;
    $('messages').append(div); $('messages').scrollTop=$('messages').scrollHeight;
  }
  async function sendConversation() {
    const ctx=conversation;
    if(!ctx || ctx.pending || ctx.complete) return;
    const text=$('conversation-text').value.trim();
    if(K.words(text).length<2) {toast('Try a short reply with at least two words.'); return;}
    stopRecognition();
    const ticket=routeTicket;
    ctx.pending=true; $('send-conversation').disabled=true; $('conversation-text').disabled=true; $('conversation-mic').disabled=true;
    $('conversation-error').innerHTML='';
    const turn=ctx.scenario.turns[Math.min(ctx.index,ctx.scenario.turns.length-1)];
    let reply;
    if(ctx.ai) {
      $('conversation-error').innerHTML='<div class="busy-indicator">Your coach is thinking…</div>';
      try {
        const result=await requestAI({kind:'conversation',text,level:state.profile.level,prompt:ctx.messages.filter(m=>m.role==='assistant').at(-1).content.slice(0,1600),scenario:`${ctx.scenario.title}. Learner role: ${ctx.scenario.role}. Coach role: ${ctx.scenario.coachRole}. Turn ${ctx.userTurns+1} of 4. ${ctx.userTurns===3?'Conclude the role play and offer one specific helpful suggestion.':'Respond briefly and ask one relevant follow-up question.'}`,messages:ctx.messages.slice(-10).map(m=>({role:m.role,content:m.content.slice(0,1000)}))});
        reply=[result.reply,result.feedback?`Language tip: ${result.feedback}`:'',result.suggestion?`Try this: ${result.suggestion}`:''].filter(Boolean).join('\n\n');
      } catch(err) {
        if(ticket!==routeTicket) return;
        $('conversation-error').innerHTML=notice(esc(err.message),'error'); ctx.pending=false; $('send-conversation').disabled=false; $('conversation-text').disabled=false; $('conversation-mic').disabled=false; return;
      }
    } else {
      const next=ctx.scenario.turns[ctx.index+1];
      const matched=K.analyzeResponse(text,turn.keywords||[]).targetHits;
      const lead=matched.length?'You included useful vocabulary for this situation.':'Try including a specific detail in your reply.';
      reply=next?`${lead} ${next.question}`:`You’ve reached the end of this role play. Read your replies once more, then try saying them without looking. A useful model for that last reply is: “${turn.example}”`;
    }
    if(ticket!==routeTicket) return;
    ctx.messages.push({role:'user',content:text}); appendMessage(ctx.messages.at(-1),ctx.messages.length-1);
    ctx.messages.push({role:'assistant',content:reply}); appendMessage(ctx.messages.at(-1),ctx.messages.length-1);
    ctx.userTurns++; ctx.index++; ctx.pending=false; $('conversation-error').innerHTML='';
    $('conversation-text').value=''; $('conversation-text').disabled=false; $('conversation-mic').disabled=false; $('send-conversation').disabled=false;
    if(ctx.userTurns>=4) {
      ctx.complete=true;
      const count=ctx.messages.filter(m=>m.role==='user').reduce((sum,m)=>sum+K.words(m.content).length,0);
      addSession('conversation',ctx.scenario.title,{id:ctx.id,source:ctx.hadVoice?'microphone':'typed',words:count,detail:`4 turns · ${ctx.ai?'AI':'guided'} role play`});
      clock.enabled=false;
      $('conversation-step').textContent='Completed';
      $('composer').innerHTML=`<div class="notice success">${icon('check')}<span>Four turns completed. ${storageOK?'Your completed activity is saved in your history.':'Your activity is in this visit’s history, but saving needs attention. Export a backup before closing.'}</span></div><div class="actions" style="margin-top:16px">${btn('Try it again','restart-conversation','secondary')}${link('See my progress','#/dashboard')}</div>`;
      $('conversation-hint').textContent='Well done for completing the conversation. Try again more independently, keeping any supplied scenario facts.';
      $('reply-example').hidden=true;
    } else {
      const next=ctx.scenario.turns[ctx.index];
      $('conversation-step').textContent=`Turn ${ctx.userTurns+1} of 4`;
      $('conversation-hint').textContent=ctx.ai?'Answer your AI partner’s latest question. Add a useful detail or ask for clarification.':next.hint;
      $('reply-example').open=false;
      if(ctx.ai) $('reply-example').hidden=true;
      else $('reply-example-text').textContent=next.example;
      $('conversation-text').focus();
    }
  }
  function pronunciation() {
    const item=C.pronunciation.find(p=>p.id===route.id)||C.pronunciation[0];
    pronunciationContext={item,source:'typed',lastSubmitted:'',id:makeID()}; beginClock();
    return `${pageHeading('Slow down. Listen. Say it again.','Practise useful phrases and notice the sounds in your own speech.')}<div class="pronunciation-layout"><div class="phrase-picker"><label for="phrase-select">Choose a phrase · ${C.pronunciation.findIndex(p=>p.id===item.id)+1} of ${C.pronunciation.length}</label><select id="phrase-select">${C.pronunciation.map((p,i)=>`<option value="${esc(p.id)}" ${p.id===item.id?'selected':''}>${String(i+1).padStart(2,'0')}. ${esc(p.title)}</option>`).join('')}</select></div><nav class="phrase-tabs" aria-label="Choose a pronunciation exercise">${C.pronunciation.map((p,i)=>`<a class="phrase-tab ${p.id===item.id?'active':''}" href="#/pronunciation/${encodeURIComponent(p.id)}" ${p.id===item.id?'aria-current="page"':''}><strong>${String(i+1).padStart(2,'0')}. ${esc(p.title)}</strong><small>${esc(p.focus)}</small></a>`).join('')}</nav><section class="panel"><span class="eyebrow">${esc(item.focus)}</span><h2 class="practice-phrase">“${esc(item.phrase)}”</h2><p class="thai" lang="th" style="margin-bottom:18px" ${state.profile.showThai?'':'hidden'}>${esc(item.thai)}</p><div class="actions">${btn(`${icon('sound')} Listen`,'listen-phrase')}${btn('Listen slowly','listen-slow','secondary')}${btn(`${icon('stop')} Stop audio`,'stop-audio','secondary small')}</div><div class="objective"><strong>A tip to try</strong><p>${esc(item.tip)}</p></div><div class="record-area"><button class="mic-button" data-action="record-pronunciation" id="pronunciation-mic" aria-label="Read the phrase into your microphone">${icon('mic')}</button><p id="pronunciation-mic-status">Read the phrase aloud when you’re ready.</p><small>Your browser may process audio remotely. You can also type a text comparison.</small></div><label for="pronunciation-text">Words your browser heard, or your typed text</label><textarea id="pronunciation-text" maxlength="1000" placeholder="Your words will appear here…">${esc(draftFor(`pronunciation:${item.id}`))}</textarea><p class="draft-note">${icon('device')} Unfinished text saves automatically on this device.</p><div class="actions" style="margin-top:15px">${btn('Compare words','compare-phrase')}${btn('Clear attempt','clear-phrase','secondary small')}</div><p class="note">Word matching compares the transcript with the phrase. It is not a pronunciation, accent, fluency, or proficiency score.</p><div id="pronunciation-feedback" aria-live="polite"></div></section></div>`;
  }
  function comparePhrase() {
    const ctx=pronunciationContext;
    if(!ctx) return;
    const text=$('pronunciation-text').value.trim();
    if(!K.words(text).length) {toast('Speak or type the phrase before comparing.'); return;}
    if(ctx.lastSubmitted===text) {toast(storageOK?'That comparison is already saved. Try another attempt.':'That comparison is completed for this visit. Review the saving alert.'); return;}
    stopRecognition();
    const result=K.compareTranscript(ctx.item.phrase,text);
    addSession('pronunciation',ctx.item.title,{id:ctx.id,source:ctx.source,score:result.score,words:K.words(text).length,detail:`${ctx.source==='typed'?'Typed text':'Speech transcript'} match`});
    if(storageOK) clearDraft(`pronunciation:${ctx.item.id}`);
    ctx.id=makeID(); ctx.lastSubmitted=text;
    $('pronunciation-feedback').innerHTML=`<div class="feedback-box"><div class="match-score"><strong>${result.score}%</strong><div><h3>${ctx.source==='typed'?'Typed text match':'Speech transcript match'}</h3><p>${result.matched} of ${result.total} target words aligned.</p></div></div>${result.missing.length?`<p style="margin-top:12px"><strong>Words to revisit:</strong></p><div class="match-words">${result.missing.map(w=>`<span>${esc(w)}</span>`).join('')}</div>`:''}${result.extra.length?`<p><strong>Additional or substituted words:</strong> ${esc(result.extra.join(', '))}</p>`:''}<p style="margin-top:13px">${result.score===100?'The words match. Now try the phrase at a comfortable, natural pace.':'Listen once more, then focus on one short part of the phrase.'}</p><p class="note">Speech recognition can mishear clear speech. Use this as a practice cue, and ask a teacher for pronunciation feedback.</p></div>`;
    beginClock();
  }
  function quizPage() {
    if(quiz?.completed) return quizResults();
    if(quiz) return quizQuestion();
    return `${pageHeading('Check what you know.','Small questions. Useful explanations. A fresh start whenever you need one.')}<div class="quiz-shell"><section class="panel quiz-intro"><div class="stat-symbol lilac">${icon('quiz')}</div><span class="eyebrow">A QUICK KNOWLEDGE CHECK</span><h2 style="margin-top:12px">Put your English to work.</h2><p>Answer 10 questions about useful phrases, vocabulary and everyday communication. Read the explanation after each answer.</p><div class="field-row"><div class="field"><label for="quiz-category">Choose a topic</label><select id="quiz-category"><option value="all">All topics</option>${Object.entries(categoryNames).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></div><div class="field"><label for="quiz-level">Choose a level</label><select id="quiz-level"><option value="all">All levels</option><option value="A1">A1 · Beginner</option><option value="A2">A2 · Elementary</option><option value="B1">B1 · Intermediate</option></select></div></div>${btn(`Let’s begin ${icon('arrow')}`,'start-quiz')}<p class="note">Up to 10 questions from a bank of ${C.quiz.length}. If your filters match fewer questions, you’ll get that smaller set. This practice quiz is not a placement test.</p></section></div>`;
  }
  function startQuiz() {
    const cat=$('quiz-category').value, level=$('quiz-level').value;
    const items=C.quiz.filter(q=>(cat==='all'||q.category===cat)&&(level==='all'||q.level===level)).slice();
    if(!items.length) {toast('No questions match those filters. Try all levels or another topic.'); return;}
    for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    quiz={items:items.slice(0,10),index:0,answers:[],selection:null,checked:false,completed:false,id:makeID()};
    beginClock(); $('main').innerHTML=quizQuestion(); $('main').focus();
  }
  function quizQuestion() {
    const q=quiz.items[quiz.index];
    return `<div class="quiz-shell">${pageHeading('One question at a time.','Choose the most suitable answer.')}<div class="quiz-meta"><span>Question ${quiz.index+1} of ${quiz.items.length}</span><span>${quiz.answers.filter(a=>a.correct).length} correct so far</span></div><div class="progress-track" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${quiz.items.length}" aria-valuenow="${quiz.index}"><span style="width:${quiz.index/quiz.items.length*100}%"></span></div><section class="panel quiz-card"><span class="tag">${esc(q.level)} · ${esc(categoryNames[q.category])}</span><h2>${esc(q.question)}</h2><div class="quiz-options" role="group" aria-label="Answer choices">${q.options.map((o,i)=>`<button class="quiz-option ${quiz.selection===i?'selected':''} ${quiz.checked?(i===q.answer?'correct':i===quiz.selection?'incorrect':''):''}" data-action="select-answer" data-index="${i}" aria-pressed="${quiz.selection===i}" ${quiz.checked?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join('')}</div>${quiz.checked?`<div style="margin-top:20px" aria-live="polite">${notice(`<strong>${quiz.selection===q.answer?'That’s right.':'A useful one to remember.'}</strong> ${esc(q.explanation)}`,quiz.selection===q.answer?'success':'warning')}</div>`:''}<div class="quiz-actions">${btn('End quiz','end-quiz','secondary small')}${quiz.checked?btn(quiz.index===quiz.items.length-1?'See my results':`Next question ${icon('arrow')}`,'next-question'):btn('Check answer','check-answer','',quiz.selection===null?'disabled':'')}</div></section></div>`;
  }
  function nextQuestion() {
    if(!quiz?.checked) return;
    if(quiz.index===quiz.items.length-1) {
      quiz.completed=true;
      const correct=quiz.answers.filter(a=>a.correct).length;
      addSession('quiz',`${quiz.items.length}-question knowledge check`,{id:quiz.id,score:Math.round(correct/quiz.items.length*100),detail:`${correct} / ${quiz.items.length} correct`});
      clock.enabled=false; $('main').innerHTML=quizResults();
    } else {quiz.index++; quiz.selection=null; quiz.checked=false; $('main').innerHTML=quizQuestion();}
    $('main').focus(); window.scrollTo({top:0,behavior:'instant'});
  }
  function quizResults() {
    const correct=quiz.answers.filter(a=>a.correct).length;
    return `<div class="quiz-shell">${pageHeading('You made time to learn.',storageOK?'Your quiz result is saved. Take a moment to review what you discovered.':'Quiz complete. Saving needs attention—export your progress before closing.')}<section class="panel quiz-intro"><span class="eyebrow">KNOWLEDGE CHECK COMPLETE</span><div class="score-result">${correct}<small> / ${quiz.items.length}</small></div><h2>${correct===quiz.items.length?'A confident finish.':'A new step forward.'}</h2><p>${correct===quiz.items.length?'You answered every question correctly. Try another topic or use these phrases in a conversation.':'Every answer is useful feedback. Review the explanations below, then try using a new phrase aloud.'}</p><div class="actions" style="justify-content:center">${btn('Try another quiz','new-quiz')}${link('See my progress','#/dashboard','secondary')}</div></section><section class="panel" style="margin-top:22px"><h2>Your answer review</h2>${quiz.items.map((q,i)=>`<article class="review-item"><span class="tag ${quiz.answers[i].correct?'':'gold'}">${quiz.answers[i].correct?'Correct':'Review'}</span><h3>${i+1}. ${esc(q.question)}</h3><p><strong>Your answer:</strong> ${esc(q.options[quiz.answers[i].selected])}</p>${quiz.answers[i].correct?'':`<p><strong>Correct answer:</strong> ${esc(q.options[q.answer])}</p>`}<p>${esc(q.explanation)}</p></article>`).join('')}</section></div>`;
  }
  function progress() {
    const m=K.metrics(state), max=Math.max(60,...m.weekly.map(d=>d.seconds));
    const sessionLabel={speaking:'Speaking',conversation:'Conversation',pronunciation:'Phrase match',quiz:'Quiz',lesson:'Lesson'};
    const history=state.sessions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,30);
    return `${pageHeading('Your progress, at your pace.','Your completed activities, learning notes and small milestones.',btn(`${icon('download')} Export backup`,'export','secondary small'))}${stats(m)}<div class="detail-grid" style="margin-top:24px"><section class="panel"><h2>Your last seven days</h2><p>Time spent on completed activities.</p><div class="week-chart" role="img" aria-label="${esc(m.weekly.map(d=>`${d.key}: ${Math.round(d.seconds/60*10)/10} minutes`).join('; '))}">${m.weekly.map(d=>`<div class="chart-col"><strong>${Math.round(d.seconds/60*10)/10} min</strong><div class="chart-bar" style="height:${Math.max(3,d.seconds/max*125)}px"></div><span>${esc(d.label)}</span></div>`).join('')}</div><p class="chart-caption">Time counts while you’re active on a learning page and is saved when you complete an activity.</p></section><section class="panel"><h2>Your learning notes</h2><p>What would you like to remember or try next?</p><label for="learning-notes" class="sr-only">Your learning notes</label><textarea id="learning-notes" maxlength="5000" style="margin-top:16px" placeholder="A new phrase, a question for your teacher, or a goal for next time…">${esc(state.notes)}</textarea><div class="notes-actions"><span id="notes-save-status" role="status">Notes save automatically on this device.</span>${btn('Save now','save-notes','secondary small')}</div></section></div><div class="section-heading"><div><h2>Your activity history</h2><p>${history.length?'Your most recent completed activities, up to 30.':'Your first completed activity will appear here.'}</p></div>${link('Practise now','#/practice','small')}</div>${history.length?`<section class="panel" style="padding:0"><div class="table-wrap" tabindex="0" role="region" aria-label="Activity history. Scroll horizontally on small screens to see all columns."><table><thead><tr><th>Activity</th><th>Date</th><th>Time</th><th>Result</th></tr></thead><tbody>${history.map(s=>`<tr><td>${esc(s.label)}<small>${sessionLabel[s.type]} · ${s.source==='microphone'?'Microphone-assisted':s.source==='typed'?'Typed':'Completed activity'}</small></td><td>${esc(new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(s.date)))}</td><td>${Math.floor(s.seconds/60)}m ${s.seconds%60}s</td><td>${s.score===null?'Completed':s.type==='speaking'?`${Math.round(s.score)} / 100 AI text review`:`${Math.round(s.score)}% ${s.type==='quiz'?'quiz':'word match'}`}</td></tr>`).join('')}</tbody></table></div></section>`:`<div class="empty-state">${icon('chart')}<h2>Your story starts here.</h2><p>Finish a lesson, submit a speaking response, or complete a quiz to begin your activity history.</p></div>`}<div class="actions" style="margin-top:22px">${btn('Import backup','import','secondary small')}${btn('Reset this learner’s progress','reset','secondary small')}${link('Saving & offline access','#/device','secondary small')}</div><p class="note">This learner’s progress is kept in this browser. It does not sync across devices. Export a backup to keep a copy, or choose another local learner in Profiles.</p>`;
  }
  function achievements() {
    const m=K.metrics(state);
    const best=state.sessions.filter(s=>s.type==='quiz'&&s.score!==null).sort((a,b)=>b.score-a.score)[0];
    return `${pageHeading('Every small win counts.','Build a practice habit, earn badges, and encourage the learners sharing this browser.')}<section class="panel local-leaderboard"><div class="section-heading"><div><span class="eyebrow">THIS BROWSER ONLY</span><h2>Your local leaderboard</h2></div>${link('Manage learners','#/profiles','secondary small')}</div><p>Participation points recognise completed practice. Each profile on this browser appears here; there is no online class ranking.</p><div class="rank-list">${rankedProfiles().map((p,i,all)=>{const rank=all.findIndex(x=>x.points===p.points)+1;return `<div class="rank-row ${p.id===activeProfileId?'current':''}"><span class="rank-number" aria-label="Rank ${rank}">${String(rank).padStart(2,'0')}</span><span class="avatar">${esc(p.name.charAt(0).toUpperCase())}</span><div class="rank-name"><strong>${esc(p.name)} ${p.id===activeProfileId?'<span class="tag">You</span>':''}</strong><small>${p.metrics.sessionCount} ${p.metrics.sessionCount===1?'activity':'activities'} · ${p.metrics.completedCount} ${p.metrics.completedCount===1?'lesson':'lessons'}</small></div><div class="rank-points"><strong>${p.points}</strong><small>points</small></div></div>`;}).join('')}</div><p class="note">10 points per completed activity, plus 20 for each completed lesson. A completed lesson is also an activity. Equal totals share a rank. These are participation points, not English proficiency scores.</p></section><div class="section-heading"><div><h2>Your achievement badges</h2><p>${esc(state.profile.name)}’s milestones, one step at a time.</p></div></div><div class="badge-grid">${m.badges.map(b=>`<article class="panel badge-card ${b.earned?'earned':''}"><div class="badge-symbol">${icon('award')}</div><h2>${esc(b.title)}</h2><p>${esc(b.description)}</p><span class="tag ${b.earned?'gold':''}">${b.earned?'Earned':'Keep going'}</span></article>`).join('')}</div><div class="section-heading"><h2>Your personal best</h2></div><section class="panel"><div class="metric-row"><div class="mini-metric"><strong>${best?`${Math.round(best.score)}%`:'—'}</strong><span>best completed quiz</span></div><div class="mini-metric"><strong>${m.streak} ${m.streak===1?'day':'days'}</strong><span>current practice streak</span></div><div class="mini-metric"><strong>${m.completedCount} / ${C.lessons.length}</strong><span>lessons completed</span></div></div><p class="note">Badges reflect participation and quiz milestones. They are not qualifications or proficiency certificates.</p></section>`;
  }
  function rankedProfiles() {
    return deviceStore.listProfiles().map(p=>{const metrics=K.metrics(p.id===activeProfileId?state:p.state);return {...p,metrics,points:metrics.sessionCount*10+metrics.completedCount*20};}).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
  }
  function profiles() {
    const profiles=deviceStore.listProfiles();
    return `${pageHeading('Your space to keep growing.','Choose a learner to keep practice, notes and preferences together.',btn(`${icon('person')} Add learner`,'new-profile','',profiles.length>=S.MAX_PROFILES?'disabled':''))}<div class="notice">${icon('device')}<span>These are local profiles on this browser. No email or password is needed. Anyone using this browser can open them.</span></div><div class="profile-grid">${profiles.map(p=>{const current=p.id===activeProfileId,m=K.metrics(current?state:p.state);return `<article class="panel learner-card ${current?'selected':''}"><div class="learner-card-head"><span class="avatar">${esc(p.name.charAt(0).toUpperCase())}</span>${current?'<span class="tag">Current learner</span>':'<span class="tag">On this device</span>'}</div><h2>${esc(p.name)}</h2><p>${m.sessionCount} ${m.sessionCount===1?'activity':'activities'} · ${m.completedCount} ${m.completedCount===1?'lesson':'lessons'} · ${m.totalMinutes} min</p><div class="actions">${current?btn('Edit preferences','settings','secondary small'):btn('Continue as this learner','switch-profile','small',`data-id="${esc(p.id)}"`)}${profiles.length>1?btn('Remove','delete-profile','text-button small',`data-id="${esc(p.id)}" aria-label="Remove ${esc(p.name)}’s profile"`):''}</div></article>`;}).join('')}</div><section class="panel profile-explainer"><div><h2>One device. Different learning journeys.</h2><p>Create up to ${S.MAX_PROFILES} profiles. Each keeps its own completed activities, learning notes, practice drafts and preferences. This is a convenience for a shared device, not a private account system.</p>${thaiGuide('โปรไฟล์แต่ละคนเก็บความก้าวหน้าและบันทึกแยกกันในเบราว์เซอร์นี้ โดยไม่มีรหัสผ่านและไม่ซิงก์ข้ามอุปกรณ์')}</div><div class="actions">${link('Saving & backups','#/device','secondary')}${link('See local leaderboard','#/leaderboard','secondary')}</div></section>`;
  }
  function newProfilePrompt() {
    if(!flushAutosave()) {toast('Save or export your current work before changing profiles.');return;}
    showDialog('A fresh space for another learner',`<p class="setting-description">Keep this learner’s practice and notes separate on this device. This profile has no password.</p><div class="field"><label for="new-profile-name">Learner name</label><input id="new-profile-name" maxlength="40" autocomplete="off" placeholder="For example, Mali"><small>Use a first name or nickname. Avoid sensitive personal details.</small></div><div id="profile-error" role="status"></div>`,`${btn('Cancel','close-dialog','secondary')}${btn('Create learner profile','create-profile')}`);
    $('new-profile-name').focus();
  }
  function applyProfile(result) {
    setStorageStatus(result.status);
    // Failed operations retain their attempted memory state in the storage layer.
    // Keep the UI aligned, but never label that state as saved.
    if(result.state && result.activeProfileId) {
      stopMedia();aiAbort?.abort();routeTicket++;clock.enabled=false;
      state=result.state;activeProfileId=result.activeProfileId;
      stateDirty=!result.status.ok;notesDirty=false;pendingDrafts.clear();
      clearTimeout(autosaveTimer);autosaveTimer=null;
      practiceContext=null;pronunciationContext=null;conversation=null;quiz=null;
      aiEnabled=false;aiToken='';externalChanged=false;
    }
    closeDialog();render();$('main').focus();
  }
  function switchProfile(id) {
    if(id===activeProfileId) return;
    if(!flushAutosave()) {toast('Your current work is not saved. Export it before switching learners.');return;}
    const result=deviceStore.switchProfile(id);applyProfile(result);
    toast(result.status.ok?`Welcome, ${state.profile.name}. Your learning space is ready.`:storageMessage());
  }
  function deleteProfilePrompt(id) {
    const p=deviceStore.listProfiles().find(x=>x.id===id);if(!p)return;
    if(!flushAutosave()) {toast('Save or export your current work before removing a profile.');return;}
    showDialog(`Remove ${p.name}’s profile?`,`<p class="setting-description">This removes <strong>${esc(p.name)}</strong> and their progress, notes and drafts from this browser. To keep a copy, switch to that learner and export their progress first. Backups exclude drafts; copy unfinished text separately.</p><label for="delete-profile-confirm">Type REMOVE to confirm</label><input id="delete-profile-confirm" autocomplete="off" placeholder="REMOVE">`,`${btn('Cancel','close-dialog','secondary')}${btn('Remove this learner','confirm-delete-profile','danger',`data-id="${esc(id)}"`)}`);
  }
  function featureGuide() {
    const icons={home:'home',lessons:'book',practice:'mic',conversation:'chat',pronunciation:'sound',progress:'chart',quiz:'quiz',leaderboard:'award',about:'info',badges:'award',profiles:'person','mobile-saving':'device'};
    return `${pageHeading('A little guidance. A confident start.','Everything you can do in your English learning space.',btn(showThaiGuide()?'Hide Thai guidance':'Show Thai guidance','toggle-thai-guide','secondary small'))}<section class="guide-intro"><div><span class="eyebrow">ENGLISH AI SPEAKING COACH</span><h2>Learn it. Say it. Keep going.</h2><p>Build useful vocabulary, try a conversation, and reflect on your next step. Start with guided practice, or use a connected AI coach when your teacher has set one up.</p>${thaiGuide('ฝึกคำศัพท์ พูดภาษาอังกฤษ และทบทวนสิ่งที่เรียนรู้ เริ่มต้นด้วยกิจกรรมแบบมีแนวทาง หรือใช้ AI เมื่อผู้สอนเชื่อมต่อระบบแล้ว')}</div><div class="guide-facts"><span><strong>${C.lessons.length}</strong> practical lessons</span><span><strong>${C.scenarios.length}</strong> conversation topics</span><span><strong>${C.quiz.length}</strong> quiz questions</span></div></section><div class="feature-grid">${C.featureGuide.map((f,i)=>`<article class="panel feature-card"><div class="feature-card-top"><span class="stat-symbol">${icon(icons[f.id]||'spark')}</span><span class="feature-number">${String(i+1).padStart(2,'0')}</span></div><h2>${esc(f.titleEn)}</h2>${thaiGuide(f.titleTh,'thai-feature-title')}<p>${esc(f.descriptionEn)}</p>${thaiGuide(f.descriptionTh)}<p class="feature-limit">${icon('info')}<span>${esc(f.limitationEn)}</span></p>${thaiGuide(f.limitationTh,'feature-limit-thai')}<a class="text-link" href="${esc(f.href)}">Explore ${icon('arrow')}</a></article>`).join('')}</div>`;
  }
  function deviceView() {
    const d=D?.snapshot()||{online:navigator.onLine,secure:window.isSecureContext,offlineReady:false};
    const articles=C.guideArticles||[];
    const saveTitle=storageOK?'Your progress has a home.':'Let’s protect your progress.';
    const offlineTitle=window.COACH_STANDALONE?'Self-contained file':d.offlineReady?'Ready for offline practice':(!d.secure||location.protocol==='file:')?'Use your HTTPS website':d.offlineError?'Offline setup needs attention':'Preparing offline access';
    const protection=d.persistent===true?'Protection granted':d.persistent===false?'Standard browser storage':'Protection not requested';
    return `${pageHeading('Pick up where you left off.','Your learning, saved locally and ready for your next small step.')}<section class="device-hero"><span class="device-hero-icon">${icon('device')}</span><div><span class="eyebrow">${esc(state.profile.name.toUpperCase())} · THIS BROWSER</span><h2>${saveTitle}</h2><p>${storageOK?`Last saved: ${esc(savedTime())}. Completed activities, preferences, notes and practice drafts stay together.`:esc(storageMessage())}</p>${thaiGuide('บันทึกอัตโนมัติในเบราว์เซอร์และที่อยู่เว็บไซต์เดิม ใช้ไฟล์สำรองเมื่อเปลี่ยนอุปกรณ์หรือเบราว์เซอร์')}</div><span class="tag ${storageOK?'':'gold'}">${storageOK?'Saved locally':'Needs attention'}</span></section>${externalChanged?notice('Another tab changed saved data. Export your current profile if needed, then reload the latest saved copy.','warning'):''}${storageStatus.recovered?notice('A previous good copy was recovered. Review your recent activities and export a fresh backup.','warning'):''}<div class="device-grid"><section class="panel"><span class="stat-symbol">${icon('download')}</span><h2>A backup you can keep.</h2><p>Download this learner’s completed progress, notes and preferences. Import the JSON file into another browser or device when you need it.</p><div class="actions">${btn('Export this learner','export')}${btn('Import backup','import','secondary')}</div><p class="note">Backups include your name and notes. Unfinished speaking drafts and other learner profiles are not included. Save each learner separately.</p></section><section class="panel"><span class="stat-symbol">${icon('shield')}</span><h2>A little more protection.</h2><p>Ask your browser to protect this site’s saved data from automatic cleanup. The browser decides whether to grant the request.</p><div class="storage-protection"><span class="tag">${esc(protection)}</span>${btn('Request storage protection','protect-storage','secondary small',d.persistent===true?'disabled':'')}</div><p class="note" id="persistence-note">${d.persistent===true?'Your browser granted persistent storage. Clearing site data still removes it.':d.persistenceSupported===false?'This browser or page does not expose storage protection. You can still use normal saving and backups.':'A request is optional and may be declined. It does not sync or back up your data.'}</p></section><section class="panel"><span class="stat-symbol">${icon('device')}</span><h2>Make practice easy to find.</h2><p>Add the HTTPS website to your home screen for a familiar app-like shortcut.</p><div class="actions">${d.installed?'<span class="tag">Opened as an installed app</span>':btn(d.installAvailable?'Install this app':'How to add to home screen','install-app','secondary')}</div><p class="note">iPhone/iPad: open in Safari, use Share, then Add to Home Screen. Android: look for Install app or Add to Home screen in your browser menu. Availability varies.</p></section><section class="panel" id="offline-card"><span class="stat-symbol">${icon('wifi')}</span><h2>${esc(offlineTitle)}</h2><p>${window.COACH_STANDALONE?'This file includes the lessons and core tools. Keep the file somewhere you can reopen it.':d.offlineReady?'The core app is cached on this device. Lessons, guided practice, quizzes and local saving can work without a connection.':(!d.secure||location.protocol==='file:')?'Offline installation and storage protection need the hosted HTTPS address. The local preview can still be used while open.':d.offlineError?esc(d.offlineError):'Keep this page online while the browser prepares the core app. The status will change when offline files are ready.'}</p><div class="actions"><span class="tag ${d.online?'':'gold'}">${d.online?'Device appears online':'Device is offline'}</span>${d.updateAvailable?btn('Save & load app update','apply-update','secondary small'):''}</div><p class="note">AI requires a connection. Microphone transcription and read-aloud voices depend on your browser and may also need the internet.</p></section></div><section class="panel recovery-panel"><h2>Keep your next step safe.</h2><p>Use the same browser and website address next time. Private browsing, clearing site data, or browser cleanup can remove local progress. Installation and storage protection are helpful, but a downloaded backup is still the copy you control.</p><div class="actions">${btn('Retry saving','retry-save','secondary small')}${btn('Reload latest saved data','reload-saved','secondary small')}${link('Manage learners','#/profiles','secondary small')}${['corrupt-data','unsupported-version'].includes(storageStatus.error)?btn('Start a new device store','recover-store','danger small'):''}</div></section><div class="section-heading"><h2>Simple guides, in English and Thai.</h2></div><div class="help-grid">${articles.map(a=>`<section class="panel guide-article"><h2>${esc(a.titleEn)}</h2>${thaiGuide(a.titleTh,'thai-feature-title')}<p>${esc(a.summaryEn)}</p>${thaiGuide(a.summaryTh)}<ol class="guide-steps">${a.steps.map(s=>`<li><strong>${esc(s.titleEn)}</strong>${thaiGuide(s.titleTh)}<p>${esc(s.textEn)}</p>${thaiGuide(s.textTh)}</li>`).join('')}</ol><p class="note">${esc(a.noteEn)}</p>${thaiGuide(a.noteTh)}</section>`).join('')}</div>`;
  }
  function reloadSavedPrompt() {
    showDialog('Reload the latest saved copy?',`<p class="setting-description">This rereads the profiles saved in this browser. Changes that could not be saved, unfinished quiz answers and conversations in this tab will be discarded.</p><p>Export your current progress first if you need it. Your export includes notes but not unfinished speaking drafts; copy those separately.</p>`,`${btn('Export current progress','export','secondary')}${btn('Cancel','close-dialog','secondary')}${btn('Reload saved copy','confirm-reload-saved')}`);
  }
  function about() {
    return `${pageHeading('Good practice starts with a safe space.','A supportive English learning space for everyday life and vocational study.')}<div class="help-grid"><section class="panel content-prose"><h2>Find the confidence to have a go.</h2><p>This coach is built around a simple routine: learn a useful phrase, hear it in context, try it yourself, and reflect on your next step. There is room for mistakes, pauses and another attempt.</p><h2>Useful English for real situations</h2><p>The library includes ${C.lessons.length} original lessons, ${C.scenarios.length} guided role plays, ${C.pronunciation.length} read-aloud exercises and ${C.quiz.length} explained quiz questions. Topics cover everyday life, travel, work and maritime study.</p><p>The A1, A2 and B1 labels are intended difficulty guides. They do not represent a certified assessment or guarantee your current English level.</p><h2>A coach with clear limits</h2><p>Guided practice uses structured prompts and basic checks of your text. Browser speech recognition turns your words into text when supported. Read-aloud playback uses available device voices.</p><p>AI feedback and adaptive conversation are optional. They require a configured server and a classroom access code. AI can make mistakes; ask a teacher if a correction or explanation seems unclear.</p><h2>For teachers and independent learners</h2><p>Use the dialogues in pairs, print a lesson, or work through a topic independently. Thai vocabulary hints can be switched on in your preferences. The bilingual feature guide explains all the learning tools. Learning notes and backups help you carry useful phrases into the next session.</p><div class="notice warning">${icon('info')}<span>Maritime lessons practise language only. They do not replace approved training, official communication procedures, or operational instructions.</span></div></section><aside class="stack"><section class="panel"><h3>Your learning routine</h3><ol class="tips-list"><li>Choose a useful topic.</li><li>Listen to an example.</li><li>Speak or type a response.</li><li>Notice one thing to improve.</li><li>Come back for another small step.</li></ol>${link('Find a lesson','#/lessons')}</section><section class="panel"><h3>Made to fit your day</h3><p>Choose a daily goal of 5, 10, 15 or 20 minutes. Your progress belongs to this browser, so you can begin without an account.</p>${btn('Set my learning goal','settings','secondary small',`style="margin-top:17px"`)}${link('Explore every feature','#/features','secondary small')}</section></aside></div>`;
  }
  function help() {
    const contact=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.contactEmail||'')?`<a class="support-mail" href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>`:'<p>A teacher contact address has not been added. Ask your teacher or the person who shared this learning space for course support.</p>';
    return `${pageHeading('A little help, when you need it.','How the coach works, where your data goes, and how to keep your progress.')}<div class="help-grid"><section class="panel"><h2>Common questions</h2><details open><summary>How do I get started?</summary><p>Choose a lesson, read its vocabulary and dialogue, and try the tasks. Use Speaking practice for your own response, Conversation for a four-turn role play, or Pronunciation to compare the words of a short phrase.</p></details><details><summary>Why doesn’t my microphone work?</summary><p>Speech recognition depends on your browser, permissions, device and sometimes a network speech service. Use the HTTPS site, allow microphone access for that site, and check your browser’s support. If it fails, type in the same response box. No activity requires a microphone.</p><p>A browser may send audio to its own service for transcription. This app does not make or store audio recordings.</p></details><details><summary>What does a word-match percentage mean?</summary><p>It compares the written or transcribed words with a target phrase. Punctuation and case are ignored, and word differences reduce the match. It cannot measure how you pronounced a sound, your accent or your English level. Speech recognition may also mishear you.</p></details><details><summary>Is the guided coach artificial intelligence?</summary><p>Guided mode uses planned prompts and simple text checks. Genuine AI feedback is available only when the site owner connects a server. In AI mode, submitted text, the prompt and recent conversation turns are sent to that server and its AI provider.</p></details><details><summary>Where is my progress saved?</summary><p>Completed activities, local profiles, learning notes and unfinished speaking or pronunciation text are saved in this browser. Look for “Saved on device” at the top. They do not sync across devices. Clearing site data or private browsing may remove them. Open Saving & offline access to export a backup or review saving problems.</p></details><details><summary>What if I leave an activity unfinished?</summary><p>Completed activities are added to your history. Learning notes and unfinished Speaking practice or Pronunciation text save automatically after a short pause and when you leave the page. Drafts are kept separately for each topic and profile. An unfinished conversation or quiz is not saved or counted. Active time pauses when the page is hidden or you stop interacting for a minute.</p></details><details><summary>Can I practise offline?</summary><p>After the HTTPS website finishes its first offline setup, core lessons, guided practice, quizzes and local saving can work offline. Check “Ready for offline practice” in Saving & offline access before relying on it. The standalone HTML file also contains the core app. Browser speech features may need the internet, and AI always needs a connection. A progress backup is not an offline copy of the app.</p></details><details><summary>How do I use Thai hints or change the voice?</summary><p>Open your profile at the top of the page. You can switch on Thai vocabulary hints, select US or UK English, and adjust read-aloud speed. The available voices depend on your device.</p></details></section><aside><section class="panel content-prose"><h2>Privacy, plainly</h2><p><strong>Saved here:</strong> your chosen display name, preferences, completion history, notes and unfinished practice text. Speaking drafts are removed after a successful completed submission or when you clear them. Raw audio and full conversations are not stored. Progress backups include your notes but exclude speaking drafts.</p><p><strong>Microphone:</strong> only starts when you choose to use it. Your browser’s speech service may process audio remotely.</p><p><strong>Optional AI:</strong> only the text you submit and its learning context are sent. The classroom access code stays in memory and clears on reload.</p><p><strong>No added tracking:</strong> this app includes no advertising, analytics scripts, remote fonts or third-party image requests. The hosting service may maintain its own access logs.</p>${btn('Export my progress','export','secondary small')}<p class="note">Backups include your notes and display name. Keep them somewhere you trust.</p></section><section class="panel"><h2>Contact your teacher</h2>${contact}</section></aside></div>`;
  }
  function settings() {
    const p=state.profile;
    const configured=validEndpoint(cfg.aiEndpoint);
    showDialog('Make this space yours',`<div class="field"><label for="setting-name">Display name</label><input id="setting-name" value="${esc(p.name)}" maxlength="40" autocomplete="nickname"></div><div class="field-row"><div class="field"><label for="setting-level">Practice level</label><select id="setting-level">${['A1','A2','B1'].map(v=>`<option ${p.level===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label for="setting-goal">Daily goal</label><select id="setting-goal">${[5,10,15,20].map(v=>`<option value="${v}" ${p.goalMinutes===v?'selected':''}>${v} minutes</option>`).join('')}</select></div></div><div class="field-row"><div class="field"><label for="setting-accent">Listening voice</label><select id="setting-accent"><option value="en-US" ${p.accent==='en-US'?'selected':''}>English · United States</option><option value="en-GB" ${p.accent==='en-GB'?'selected':''}>English · United Kingdom</option></select></div><div class="field"><label for="setting-rate">Read-aloud speed</label><select id="setting-rate">${[[.7,'Slow'],[.9,'Comfortable'],[1,'Natural'],[1.1,'A little faster']].map(([v,t])=>`<option value="${v}" ${Math.abs(p.rate-v)<.05?'selected':''}>${t}</option>`).join('')}</select></div></div><label class="checkbox-label"><input type="checkbox" id="setting-thai" ${p.showThai?'checked':''}>Show Thai vocabulary and phrase hints</label><label class="checkbox-label"><input type="checkbox" id="setting-thai-guide" ${showThaiGuide()?'checked':''}>Show Thai guidance and feature explanations</label><div class="profile-links">${btn('Switch or add learner','open-profiles','secondary small')}${btn('Saving & offline access','open-device','secondary small')}</div><h3>Your coach</h3>${configured?`<p class="setting-description">Guided mode works immediately. AI mode sends submitted text and recent conversation context to your configured coach. Use the access code provided by your teacher.</p><label class="checkbox-label"><input type="checkbox" id="setting-ai" ${aiEnabled?'checked':''}>Enable AI feedback and conversation for this visit</label><div class="field" style="margin-top:16px"><label for="setting-code">Classroom access code</label><input type="password" id="setting-code" value="" placeholder="${aiToken?'Code already set for this visit':'Enter your classroom access code'}" autocomplete="off"><small>This is a classroom code, never an AI provider API key. It is cleared when you reload.</small></div>`:`<p class="setting-description">Guided mode is active. The site owner can connect an AI server using the setup files in this project. Everything in the core practice library works without it.</p>`}<h3>Keep a copy of your progress</h3><div class="actions">${btn(`${icon('download')} Export`,'export','secondary small')}${btn('Import backup','import','secondary small')}</div><div id="settings-error"></div>`,`${btn('Cancel','close-dialog','secondary')}${btn('Save preferences','save-settings')}`);
  }
  function saveSettings() {
    const enabled=$('setting-ai')?.checked || false;
    const code=$('setting-code')?.value.trim() || aiToken;
    if(enabled&&!code) {$('settings-error').innerHTML='<p class="error-text">Enter the classroom access code to enable AI mode.</p>'; return;}
    if(enabled && /^(sk-|sk_proj_|sk-proj-)/i.test(code)) {$('settings-error').innerHTML='<p class="error-text">Use the classroom access code, not a provider API key. Provider keys belong only on the server.</p>'; return;}
    state.profile={name:$('setting-name').value.trim()||'Learner',level:$('setting-level').value,goalMinutes:Number($('setting-goal').value),accent:$('setting-accent').value,rate:Number($('setting-rate').value),showThai:$('setting-thai').checked};
    aiEnabled=enabled; aiToken=enabled?code:'';
    persist();
    setStorageStatus(deviceStore.setPreference('showThaiGuide',$('setting-thai-guide').checked));
    if(storageOK){stateDirty=false;notesDirty=false;}
    updateShell();
    closeDialog();
    document.querySelectorAll('[data-thai-guide]').forEach(el=>{el.hidden=!showThaiGuide();});
    document.querySelectorAll('.thai').forEach(el=>{el.hidden=!state.profile.showThai;});
    if(['home','profiles','device','features','leaderboard'].includes(route.page)) render();
    if(route.page==='practice' && $('submit-practice')) {
      $('submit-practice').innerHTML=`${icon('spark')} ${aiEnabled?'Get AI feedback':'Get practice feedback'}`;
      $('coach-mode-note').textContent=aiEnabled?'AI feedback is sent to your configured coach. You can edit the transcript before submitting.':'Guided mode offers a basic word and phrase check. It does not grade pronunciation, fluency, or English proficiency.';
      $('coach-mode-description').textContent=aiEnabled?'AI mode is enabled for submitted text.':'Guided mode is ready to use without an account.';
    }
    toast(!storageOK?'Preferences are changed for this visit, but could not be saved.':route.page==='conversation'&&conversation?'Preferences saved. Coach mode changes apply to your next conversation.':'Your preferences are saved.');
  }
  function validEndpoint(value) {try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && !u.hash && u.pathname.endsWith('/coach'); } catch {return false;} }
  async function requestAI(payload) {
    if(!aiEnabled||!aiToken||!validEndpoint(cfg.aiEndpoint)) throw new Error('AI mode is not configured. Use guided mode or ask your teacher for the access code.');
    aiAbort=new AbortController();
    const controller=aiAbort;
    const timer=setTimeout(()=>controller.abort(),35000);
    try {
      const response=await fetch(cfg.aiEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${aiToken}`},body:JSON.stringify(payload),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
      const raw=await response.text();
      if(raw.length>24000) throw new Error('The coach returned too much text. Please try a shorter response.');
      let data; try {data=JSON.parse(raw);}catch {throw new Error('The coach returned an unreadable response. Guided mode is still available.');}
      if(!response.ok) {
        if(response.status===401||response.status===403) throw new Error('The coach did not accept this access code or site. Check with your teacher.');
        if(response.status===429) throw new Error('The coach is receiving too many requests. Please try again in a minute.');
        throw new Error('The AI coach is temporarily unavailable. Try again or use guided mode.');
      }
      if(payload.kind==='feedback'&&(typeof data.feedback!=='string'||typeof data.suggestion!=='string')) throw new Error('The coach feedback was incomplete. Please try again.');
      if(payload.kind==='feedback' && data.scores!==undefined && !validAIScores(data.scores)) throw new Error('The coach returned an invalid text rating. Please try again.');
      if(payload.kind==='conversation'&&(typeof data.reply!=='string'||!data.reply.trim())) throw new Error('The coach reply was incomplete. Please try again.');
      return data;
    } catch(err) {
      if(err.name==='AbortError') throw new Error('The coach request was stopped or took too long. You can try again.');
      if(err instanceof TypeError) throw new Error('Could not reach the AI coach. Check your connection or use guided mode.');
      throw err;
    } finally {clearTimeout(timer); if(aiAbort===controller) aiAbort=null;}
  }
  function exportBackup() {
    flushAutosave();
    const text=JSON.stringify({app:'English AI Speaking Coach',exportedAt:new Date().toISOString(),...K.normalizeState(state)},null,2);
    download(text,`english-coach-progress-${K.localDateKey(new Date())}.json`,'application/json');
    toast('This learner’s progress backup is ready. Unfinished drafts are not included.');
  }
  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function importBackup() {
    const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json';
    input.addEventListener('change',async()=>{
      const file=input.files?.[0]; if(!file) return;
      if(file.size>8*1024*1024) {toast('Choose a progress JSON file smaller than 8 MiB.'); return;}
      try {
        const raw=JSON.parse(await file.text());
        if(raw.app!=='English AI Speaking Coach'||raw.version!==1||!Array.isArray(raw.sessions)||!Array.isArray(raw.completedLessons)||!raw.profile) throw new Error('not-backup');
        const imported=K.normalizeState(raw);
        imported.completedLessons=imported.completedLessons.filter(id=>C.lessons.some(l=>l.id===id));
        showDialog('Replace progress from a backup?',`<p class="setting-description">This backup contains ${imported.sessions.length} ${imported.sessions.length===1?'activity':'activities'} and ${imported.completedLessons.length} completed ${imported.completedLessons.length===1?'lesson':'lessons'} for <strong>${esc(imported.profile.name)}</strong>. It will replace the current learner’s progress and clear their drafts. Other local learners will stay as they are.</p><p class="note">Export your current progress first if you want to keep it.</p>`,`${btn('Cancel','close-dialog','secondary')}${btn('Import this backup','confirm-import')}`);
        $('app-dialog')._pendingImport=imported;
      } catch {toast('That file is not a valid English Speaking Coach backup. No progress was changed.');}
    }); input.click();
  }
  function resetPrompt() {
    showDialog('Start fresh for this learner?',`<p class="setting-description">This removes <strong>${esc(state.profile.name)}</strong>’s saved activities, completed lessons, notes, drafts and preferences. Other learner profiles stay as they are. Export a backup to keep completed progress and notes. Backups exclude drafts; copy unfinished text separately.</p><label for="reset-confirm">Type RESET to confirm</label><input id="reset-confirm" autocomplete="off" placeholder="RESET">`,`${btn('Cancel','close-dialog','secondary')}${btn('Reset progress','confirm-reset','danger')}`);
  }
  function voiceFor(accent) {
    const voices=window.speechSynthesis?.getVoices()||[];
    return voices.find(v=>v.lang===accent)||voices.find(v=>v.lang.toLowerCase().startsWith(accent.toLowerCase()))||voices.find(v=>v.lang.toLowerCase().startsWith('en'))||null;
  }
  function say(text,slow=false) {
    if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)) {toast('Read-aloud is not available in this browser. You can still read the example.'); return;}
    stopRecognition(); window.speechSynthesis.cancel();
    speech=new SpeechSynthesisUtterance(text); speech.lang=state.profile.accent; speech.rate=slow ? 0.7 : state.profile.rate;
    const voice=voiceFor(state.profile.accent); if(voice) speech.voice=voice;
    speech.onerror=(event)=>{if(!['canceled','interrupted'].includes(event.error)) toast('Audio playback is unavailable. Check your device sound or try again.');};
    window.speechSynthesis.speak(speech);
  }
  if('speechSynthesis'in window) {window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener?.('voiceschanged',()=>window.speechSynthesis.getVoices());}
  function stopRecognition() {
    recognitionTicket++; clearTimeout(recognitionStopTimer);
    if(recognition) {try {recognition.abort();}catch{} recognition=null;}
    recording=false;
    document.querySelectorAll('.listening').forEach(b=>{b.classList.remove('listening'); if(b.classList.contains('mic-button')) b.innerHTML=icon('mic'); b.setAttribute('aria-label','Start microphone');});
    ['practice','pronunciation','conversation'].forEach(prefix=>{const el=$(`${prefix}-mic-status`); if(el?.dataset.active==='yes'){el.textContent='Microphone stopped. You can review or edit your text.'; el.dataset.active='no';}});
  }
  function stopMedia() {stopRecognition(); window.speechSynthesis?.cancel();}
  function record(prefix) {
    if(recording) {try {recognition?.stop();}catch{stopRecognition();} return;}
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const area=$(`${prefix}-text`), status=$(`${prefix}-mic-status`), button=$(`${prefix}-mic`);
    if(!SpeechRecognition) {status.textContent='Speech recognition is not supported in this browser. Please type your response below.'; area.focus(); return;}
    if(!window.isSecureContext) {status.textContent='Microphone practice needs HTTPS or localhost. You can type your response here.'; area.focus(); return;}
    stopMedia();
    const token=++recognitionTicket;
    const prior=area.value.trim(); let committed=''; let received=false;
    recognition=new SpeechRecognition(); const current=recognition;
    current.lang=state.profile.accent; current.interimResults=true; current.continuous=false; current.maxAlternatives=1;
    current.onstart=()=>{
      if(token!==recognitionTicket) return;
      recording=true; button.classList.add('listening'); button.setAttribute('aria-label','Stop microphone');
      if(button.classList.contains('mic-button')) button.innerHTML=icon('stop');
      status.textContent='Listening… speak a short response. Select the microphone again to finish.'; status.dataset.active='yes';
      recognitionStopTimer=setTimeout(()=>{try{current.stop();}catch{}},45000);
    };
    current.onresult=(event)=>{
      if(token!==recognitionTicket) return;
      let interim=''; committed='';
      for(let i=0;i<event.results.length;i++){if(event.results[i].isFinal) committed+=`${event.results[i][0].transcript} `; else interim+=`${event.results[i][0].transcript} `;}
      const combined=[prior,committed.trim(),interim.trim()].filter(Boolean).join(' ');
      area.value=combined.slice(0,area.maxLength>0?area.maxLength:3000); received=true;
      if(prefix==='practice') {practiceContext.source='microphone'; updateWordCount();queueDraft('practice',area.value);}
      if(prefix==='pronunciation') {pronunciationContext.source='microphone';queueDraft('pronunciation',area.value);}
      if(prefix==='conversation') conversation.hadVoice=true;
    };
    current.onerror=(event)=>{
      if(token!==recognitionTicket) return;
      const messages={'not-allowed':'Microphone permission was denied. Allow it in your browser settings, or type your answer.','service-not-allowed':'Your browser’s speech service is unavailable. Please type your answer.','audio-capture':'No available microphone was found. Check the device or type your answer.','no-speech':'No speech was detected. Try again in a quiet place, or type your answer.','network':'The speech service could not connect. Check your connection or type your answer.','language-not-supported':'This speech language is unavailable. Please type your answer.'};
      status.textContent=messages[event.error]||(event.error==='aborted'?'Microphone stopped.':'Speech recognition stopped. Your typed response still works.'); status.dataset.active='error';
    };
    current.onend=()=>{
      if(token!==recognitionTicket) return;
      recording=false; recognition=null; clearTimeout(recognitionStopTimer); button.classList.remove('listening'); button.setAttribute('aria-label','Start microphone');
      if(button.classList.contains('mic-button')) button.innerHTML=icon('mic');
      if(status.dataset.active!=='error') status.textContent=received?'Microphone finished. Check the words, then submit when you’re ready.':'No transcript received. Try again or type below.';
      status.dataset.active='no';
    };
    try {current.start();} catch {status.textContent='Could not start speech recognition. Please type your response.'; stopRecognition();}
  }
  function updateWordCount() { if($('practice-word-count')) $('practice-word-count').textContent=`${K.words($('practice-text').value).length} words`; }
  function render() {
    flushAutosave();
    stopMedia(); aiAbort?.abort(); routeTicket++; clock.enabled=false;
    const parts=location.hash.replace(/^#\/?/,'').split('/');
    let page=parts[0]||'home', id=''; try{id=decodeURIComponent(parts[1]||'');}catch{}
    if(page==='progress') page='dashboard';
    if(!titleNames[page]) page='home';
    if(page!=='quiz'&&route.page==='quiz') quiz=null;
    route={page,id};
    const views={home,lessons,practice,conversation:conversations,pronunciation,dashboard:progress,quiz:quizPage,leaderboard:achievements,profiles,device:deviceView,features:featureGuide,about,contact:help};
    $('main').innerHTML=views[page]();
    if(page==='conversation'&&id&&conversation&&$('messages')) conversation.messages.forEach(appendMessage);
    document.querySelectorAll('#navigation [data-nav], #mobile-navigation [data-nav]').forEach(a=>{const active=a.dataset.nav===page;a.classList.toggle('active',active); if(active)a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');});
    $('more-button').classList.toggle('active',!['home','lessons','practice','dashboard'].includes(page));
    $('main').dataset.view=page;
    const resumeID=page==='practice'?practiceContext?.lessonId:page==='pronunciation'?pronunciationContext?.item.id:id;
    rememberRoute(page,resumeID);
    $('breadcrumb-current').textContent=titleNames[page]; document.title=`${titleNames[page]} · English AI Speaking Coach`;
    updateShell(); closeMenu(); window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',async(event)=>{
    if(event.target.closest('.skip-link')){event.preventDefault();$('main').focus();$('main').scrollIntoView();return;}
    const button=event.target.closest('[data-action]'); if(!button||button.disabled) return;
    const action=button.dataset.action;
    switch(action) {
      case 'close-dialog':closeDialog();break;
      case 'settings':settings();break;
      case 'save-settings':saveSettings();break;
      case 'open-profiles':closeDialog();location.hash='#/profiles';break;
      case 'open-device':closeDialog();location.hash='#/device';break;
      case 'new-profile':newProfilePrompt();break;
      case 'create-profile':{
        const name=$('new-profile-name').value.trim();
        if(!name){$('profile-error').textContent='Enter a learner name to continue.';$('new-profile-name').focus();break;}
        const result=deviceStore.createProfile(name);
        if(!result.status.ok && ['profile-limit','invalid-state'].includes(result.status.error)) {$('profile-error').textContent=result.status.error==='profile-limit'?`This browser can keep up to ${S.MAX_PROFILES} profiles.`:'Choose another learner name.';break;}
        applyProfile(result);toast(result.status.ok?`${state.profile.name}’s profile is ready.`:storageMessage());break;
      }
      case 'switch-profile':switchProfile(button.dataset.id);break;
      case 'delete-profile':deleteProfilePrompt(button.dataset.id);break;
      case 'confirm-delete-profile':if($('delete-profile-confirm').value==='REMOVE'){const result=deviceStore.deleteProfile(button.dataset.id);applyProfile(result);toast(result.status.ok?'Learner profile removed from this browser.':storageMessage());}else toast('Type REMOVE exactly to confirm.');break;
      case 'toggle-thai-guide':setStorageStatus(deviceStore.setPreference('showThaiGuide',!showThaiGuide()));render();document.querySelector('[data-action="toggle-thai-guide"]')?.focus();break;
      case 'retry-save':{persist();const ok=flushAutosave();render();toast(ok?'Your current progress is saved on this device.':storageMessage());break;}
      case 'reload-saved':reloadSavedPrompt();break;
      case 'confirm-reload-saved':{clearTimeout(autosaveTimer);autosaveTimer=null;pendingDrafts.clear();stateDirty=false;notesDirty=false;const result=deviceStore.reload();applyProfile(result);toast(result.status.ok?'Loaded the latest saved profiles.':storageMessage());break;}
      case 'protect-storage':{
        button.disabled=true;button.textContent='Asking your browser…';
        const granted=await D?.requestPersistence();
        if(route.page==='device'){$('main').innerHTML=deviceView();document.querySelector('[data-action="protect-storage"]')?.focus();}
        toast(granted?'Your browser granted storage protection. Keep a backup too.':'Storage protection was not granted or is unavailable. Normal saving and backups still work when allowed.');break;
      }
      case 'install-app':{
        const installed=await D?.install();
        if(!installed) showDialog('Keep the coach on your home screen',`<p>Open your deployed HTTPS website in your usual mobile browser.</p><ol class="list"><li><strong>iPhone or iPad:</strong> in Safari, open Share, then Add to Home Screen.</li><li><strong>Android:</strong> open the browser menu and look for Install app or Add to Home screen.</li></ol><p class="note">The option varies by browser and may be unavailable in an in-app browser or for a downloaded HTML file. Use the same browser and site address to find your local progress. Export a backup before changing browsers.</p>`,btn('Got it','close-dialog'));break;
      }
      case 'apply-update':if(flushAutosave()){if(!D?.applyUpdate())toast('No waiting update is available. Reload the page when you are ready.');}else toast('Save or export your current work before updating the app.');break;
      case 'recover-store':showDialog('Replace unreadable device data?',`<p class="setting-description">This creates a new empty learner store and replaces the current store and its recovery copy for this website. Any unreadable profiles in that store will be lost. The older v1 storage record is kept.</p><p>Export this visit’s progress before continuing. If you have a downloaded backup, import it after the reset.</p><label for="recover-confirm">Type NEW STORE to confirm</label><input id="recover-confirm" autocomplete="off" placeholder="NEW STORE">`,`${btn('Export current progress','export','secondary')}${btn('Cancel','close-dialog','secondary')}${btn('Create empty store','confirm-recover-store','danger')}`);break;
      case 'confirm-recover-store':if($('recover-confirm').value==='NEW STORE'){applyProfile(deviceStore.reset());toast(storageOK?'A new device store is ready. You can import a backup now.':storageMessage());}else toast('Type NEW STORE exactly to confirm.');break;
      case 'filter':filter=button.dataset.value; $('main').innerHTML=lessons();break;
      case 'clear-search':filter='all';search='';$('main').innerHTML=lessons();break;
      case 'speak-vocab':{const v=getLesson(button.dataset.id)?.vocabulary[Number(button.dataset.index)];if(v)say(`${v.word}. ${v.example}`);break;}
      case 'listen-dialogue':{const l=getLesson(button.dataset.id);if(l)say(l.dialogue.map(d=>d.text).join(' '));break;}
      case 'print':window.print();break;
      case 'complete-lesson':{
        const l=getLesson(button.dataset.id);if(!l||state.completedLessons.includes(l.id))break;
        if(!Array.from(document.querySelectorAll('.lesson-task')).every(c=>c.checked))break;
        state.completedLessons.push(l.id);addSession('lesson',l.title,{id:`lesson-${l.id}`});
        button.textContent='Lesson completed';button.disabled=true;clock.enabled=false;document.querySelectorAll('.lesson-task').forEach(c=>c.disabled=true);completionToast('Lesson completed. A small step worth celebrating.');break;}
      case 'record-practice':record('practice');break;
      case 'record-pronunciation':record('pronunciation');break;
      case 'record-conversation':record('conversation');break;
      case 'submit-practice':await submitPractice();break;
      case 'starter':$('practice-text').value=getLesson(practiceContext.lessonId).starter;practiceContext.source='typed';updateWordCount();queueDraft('practice',$('practice-text').value);$('practice-text').focus();break;
      case 'clear-practice':stopRecognition();$('practice-text').value='';$('practice-feedback').innerHTML='';practiceContext.source='typed';practiceContext.lastSubmitted='';practiceContext.sessionID=makeID();clearDraft(`practice:${practiceContext.lessonId}`);updateWordCount();beginClock();$('practice-text').focus();break;
      case 'speak-model':say(getLesson(practiceContext.lessonId).modelAnswer);break;
      case 'listen-response':say(practiceContext.lastResponse || $('practice-text').value);break;
      case 'send-conversation':await sendConversation();break;
      case 'restart-conversation':render();break;
      case 'speak-message':{const m=conversation?.messages[Number(button.dataset.index)];if(m)say(m.content);break;}
      case 'listen-phrase':say(pronunciationContext.item.phrase);break;
      case 'listen-slow':say(pronunciationContext.item.phrase,true);break;
      case 'stop-audio':stopMedia();break;
      case 'compare-phrase':comparePhrase();break;
      case 'clear-phrase':stopRecognition();$('pronunciation-text').value='';$('pronunciation-feedback').innerHTML='';pronunciationContext.source='typed';pronunciationContext.lastSubmitted='';pronunciationContext.id=makeID();clearDraft(`pronunciation:${pronunciationContext.item.id}`);beginClock();break;
      case 'start-quiz':startQuiz();break;
      case 'select-answer':if(quiz&&!quiz.checked){quiz.selection=Number(button.dataset.index);$('main').innerHTML=quizQuestion();document.querySelector(`[data-action="select-answer"][data-index="${quiz.selection}"]`)?.focus();}break;
      case 'check-answer':if(quiz&&quiz.selection!==null&&!quiz.checked){quiz.checked=true;quiz.answers.push({selected:quiz.selection,correct:quiz.selection===quiz.items[quiz.index].answer});$('main').innerHTML=quizQuestion();document.querySelector('[data-action="next-question"]')?.focus();}break;
      case 'next-question':nextQuestion();break;
      case 'end-quiz':showDialog('Leave this quiz?', '<p class="setting-description">This quiz is unfinished. Your answers will not be added to your progress.</p>',`${btn('Keep practising','close-dialog','secondary')}${btn('Leave quiz','confirm-end-quiz')}`);break;
      case 'confirm-end-quiz':quiz=null;closeDialog();render();break;
      case 'new-quiz':quiz=null;render();break;
      case 'save-notes':state.notes=$('learning-notes').value;notesDirty=true;toast(flushAutosave()?'Your learning notes are saved.':storageMessage());break;
      case 'export':exportBackup();break;
      case 'import':importBackup();break;
      case 'confirm-import':if($('app-dialog')._pendingImport){const imported=$('app-dialog')._pendingImport;delete $('app-dialog')._pendingImport;pendingDrafts.clear();notesDirty=false;stateDirty=false;applyProfile(deviceStore.replaceProfile(imported));toast(storageOK?'This learner’s backup has been imported.':storageMessage());}break;
      case 'reset':resetPrompt();break;
      case 'confirm-reset':if($('reset-confirm').value==='RESET'){pendingDrafts.clear();notesDirty=false;stateDirty=false;applyProfile(deviceStore.resetProfile());toast(storageOK?'This learner’s progress has been reset.':storageMessage());}else toast('Type RESET exactly to confirm.');break;
      default:break;
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='lesson-search'){search=event.target.value;$('lesson-results').innerHTML=lessonResults();}
    if(event.target.id==='practice-text'){practiceContext.source='typed';updateWordCount();queueDraft('practice',event.target.value);}
    if(event.target.id==='pronunciation-text'){pronunciationContext.source='typed';queueDraft('pronunciation',event.target.value);}
    if(event.target.id==='learning-notes'){state.notes=event.target.value;notesDirty=true;stateDirty=true;scheduleAutosave();}
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='practice-topic') {
      const hash=`#/practice/${encodeURIComponent(event.target.value)}`;
      focusAfterRoute={hash,id:'practice-topic'};
      location.hash=hash;
    }
    if(event.target.id==='phrase-select') {
      const hash=`#/pronunciation/${encodeURIComponent(event.target.value)}`;
      focusAfterRoute={hash,id:'phrase-select'};
      location.hash=hash;
    }
    if(event.target.classList.contains('lesson-task'))$('complete-lesson').disabled=!Array.from(document.querySelectorAll('.lesson-task')).every(c=>c.checked);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !$('app-dialog').open && $('sidebar').classList.contains('open')) { event.preventDefault(); closeMenu(true); }
    if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&event.target.id==='conversation-text'){event.preventDefault();sendConversation();}
    if(event.key==='Tab'&&$('sidebar').classList.contains('open')){
      const links=Array.from($('sidebar').querySelectorAll('a[href],button:not([disabled])')).filter(el=>el.getClientRects().length);
      if(!links.length) return;
      if(!$('sidebar').contains(document.activeElement)){event.preventDefault();links[0].focus();}
      else if(event.shiftKey&&document.activeElement===links[0]){event.preventDefault();links.at(-1).focus();}
      else if(!event.shiftKey&&document.activeElement===links.at(-1)){event.preventDefault();links[0].focus();}
    }
  });
  $('profile-button').addEventListener('click',settings);
  $('menu-button').addEventListener('click',toggleMenu);
  $('more-button').addEventListener('click',toggleMenu);
  $('nav-close').addEventListener('click',()=>closeMenu(true));
  $('sidebar').addEventListener('click',event=>{
    const anchor=event.target.closest('a[href^="#/"]');
    if(anchor && $('sidebar').classList.contains('open')) {
      const samePage=anchor.hash===(location.hash || '#/home');
      closeMenu();
      if(samePage) $('main').focus();
    }
  });
  mobileLayout.addEventListener('change',()=>{if(!mobileLayout.matches) closeMenu(true);});
  $('nav-shade').addEventListener('click',()=>closeMenu(true));
  $('app-dialog').addEventListener('click',event=>{if(event.target===$('app-dialog'))closeDialog();});
  $('app-dialog').addEventListener('close',()=>{
    delete $('app-dialog')._pendingImport;
    const resume=$('app-dialog')._resumeClock;
    if(resume?.ticket===routeTicket){clock.enabled=resume.enabled;clock.last=performance.now();clock.interaction=performance.now();}
    delete $('app-dialog')._resumeClock;
  });
  window.addEventListener('hashchange',()=>{
    if(location.hash==='#main'){$('main').focus();return;}
    render();
    const target=focusAfterRoute?.hash===location.hash ? $(focusAfterRoute.id) : $('main');
    focusAfterRoute=null;
    (target || $('main')).focus();
  });
  window.addEventListener('pagehide',()=>{stopMedia();flushAutosave();aiAbort?.abort();});
  window.addEventListener('storage',event=>{if(event.storageArea===browserStorage && (event.key===null || [deviceStore.keys.main,deviceStore.keys.backup].includes(event.key))){externalChanged=true;updateShell();}});
  window.addEventListener('coach-device-change',()=>{if(route.page==='device'&&!$('app-dialog').open){const focused=document.activeElement?.dataset.action;$('main').innerHTML=deviceView();if(focused)document.querySelector(`[data-action="${focused}"]`)?.focus();}});
  D?.init();
  render();
})();
