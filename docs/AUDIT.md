# Content and technical audit

**Project:** English AI Speaking Coach  
**Documented version:** 2.0.0  
**Audit date:** 5 November 2026  
**Source attachment:** `English AI Speaking Coach — Practice English with AI.html`

**Version 2 checks recorded on 5 November 2026:** source validation, all 75 automated tests, the static build, and standalone generation passed. The verification record below separates browser observations, automated mocked checks, and behavior not exercised on real devices or services.

## Scope and source limits

The supplied attachment is a browser-saved HTML snapshot of the original site's **home page**, with a recorded source origin of `https://speak-wise-ai-83.lovable.app/`. It contains 2,598,919 bytes, approximately 2.60 MB. The upload did not include the companion asset directory or a source repository.

All user-visible home-page content, navigation destinations, referenced assets, and available scripts were inspected during the initial rebuild. The attachment links to nine additional sections, but their documents and application implementation are absent. This project preserves the educational purpose while supplying newly authored learning content and application behavior. It does not recover unavailable original lessons, quizzes, account records, assessment models, or backend services.

## Confirmed source problems and corrections

| Finding in the saved attachment | Rebuild decision |
|---|---|
| Six distinct local dependencies are absent: application CSS, font CSS, application entry JavaScript, robot illustration, and two analytics scripts. Eight references point to these files because some are preloaded. | Supply the app's HTML, styles, scripts, icons, and visual elements locally. The core interface does not depend on remote fonts or illustrations. |
| Twenty-six navigation links point to the old hosted origin. | Use internal hash routes and relative asset URLs that support GitHub repository paths. |
| The mobile menu depends on absent JavaScript and lacks expanded-state and controlled-region attributes. | Provide a labelled menu with `aria-expanded`, `aria-controls`, keyboard handling, and responsive navigation. |
| No functioning speech, AI, progress, quiz, or conversation implementation is supplied. The inline script only handles the original builder badge. | Implement local learning flows and separate their behavior from optional server-generated AI. |
| A large browser-extension shadow DOM, styles, and embedded assets are unrelated to learning. | Remove extension payloads, incidental tracking metadata, analytics references, and the builder-edit overlay. |
| “50k+ Learners,” “300+ Lessons,” “98% Improve,” and the decorative “Score 94” lack evidence. | Show actual content counts and saved learner activity. Local ranking data comes from actual local profiles; no fictional classmates, testimonials, usage totals, or success rates are introduced. |
| Marketing claims pronunciation, grammar, fluency, and vocabulary scores without an assessment implementation. | Distinguish guided text checks, transcript word matching, quiz results, participation points, and optional AI text-rubric feedback. No acoustic error detection or assessed proficiency is claimed. |
| Favicon and social metadata point to the old deployment. | Supply metadata and local icons for this project, including hosted-app installation icons. |
| There is no JavaScript-disabled explanation. | Include a `noscript` explanation and a missing-assets fallback. |

## Version 2 section mapping

| Requested or original section | Route | Actual scope |
|---|---|---|
| Home Page / หน้าหลัก | `#/home` | Learning shortcuts, the selected profile's activity summaries, and daily goal. |
| Speaking Lessons / บทเรียนภาษาอังกฤษ | `#/lessons` | 13 lessons with objectives, vocabulary, dialogues, tips, models, tasks, and completion checklists. |
| AI Speaking Practice / ฝึกพูดกับ AI | `#/practice` | Guided response checks by default; optional configured-server text feedback and rubric ratings. |
| AI Conversation / สนทนากับ AI | `#/conversation` | 7 prepared four-turn scenarios; adaptive replies only when the optional AI service is connected. |
| Pronunciation / ฝึกการออกเสียง | `#/pronunciation` | 14 listening/read-aloud phrases, useful delivery tips, and clearly labelled typed/transcript word matching. |
| Progress Tracking / ติดตามความก้าวหน้า | `#/dashboard` | Local completed-activity summaries, active time, chart, history, notes, and current-profile backups. |
| Quiz / แบบทดสอบ | `#/quiz` | 35 explained multiple-choice questions; topic/level filters and up to 10 questions per attempt. |
| Leaderboard / กระดานจัดอันดับ | `#/leaderboard` | Participation ranking of profiles in this browser/site, followed by the selected profile's achievement badges. |
| About / เกี่ยวกับเว็บไซต์ | `#/about` | Purpose, intended learners, and learning modes. |
| User Login / เข้าสู่ระบบ | `#/profiles` | An explicitly local chooser for up to 8 learner profiles; no password-protected online sign-in or identity verification. |
| Feature guide | `#/features` | English/Thai explanations of the requested features, actual capabilities, and limits. |
| Mobile saving | `#/device` | Save/offline status, backup options, installation help, and supported persistent-storage requests. |
| Contact and help | `#/contact` | Practical help and privacy information, plus an optional real teacher email link. No fake message submission. |

## Learning and bilingual content inventory

The release contains **13 lessons** with six vocabulary entries each: **78 entries**, not necessarily 78 unique words. Everyday English has the original three levels plus an additional A2 food-ordering lesson. Each other category has one A1, one A2, and one B1 lesson.

| Topic | A1 | A2 | B1 |
|---|---|---|---|
| Everyday English | Meet someone new | Talk about your day; Order a meal politely | Make a plan together |
| Travel | Find your way | Check in with confidence | Explain a travel problem |
| Work and study | Ask for help at work | Your first job interview | Give a clear progress update |
| Maritime English | Introduce yourself on board | Find places on board | Report what you observed |

The **7 guided scenarios** are A new classmate, Plan a study session, At the café counter, At the hotel desk, A missed connection, Your first interview, and A clear on-board report. Each has four learner turns, for **28 prepared turns**. The phrase bank contains **14 exercises**. The quiz bank contains **35 questions**, each with four options, one correct answer, and an explanation.

The version 2 food addition supplies a complete A2 lesson, one café scenario, two pronunciation phrases, and five questions. Its menu and prices are explicitly fictional. The previously authored lesson, scenario, phrase, and quiz entries are retained; maritime instructional content is unchanged.

The content module also exports **12 bilingual feature-guide entries**: the nine requested main features, achievement badges, local profiles, and mobile saving. Two bilingual guide articles cover saving on mobile and practising safely. Thai hints continue to support vocabulary and phrase meanings. This does not claim that every learning paragraph or interface label is translated.

A1/A2/B1 labels describe intended practice difficulty, not an independently validated learner classification. Fictional people and settings are instructional examples, not student records. Maritime material teaches language, clarification, location descriptions, and factual reporting; it does not replace operational procedures, approved training, or certification.

## Scoring and feedback boundaries

| Result | Calculation or evidence | What it does not establish |
|---|---|---|
| Guided speaking checks | Word count, visible target-word/phrase matches, and a limited set of text-pattern hints. | Comprehensive grammar accuracy, spoken fluency, or a proficiency level. |
| Phrase match | Normalized typed text or a browser-produced transcript compared with the phrase. | Acoustic pronunciation errors, phonemes, accent, intonation, or speech quality. |
| Quiz score | Correct answers in the completed question set. | Placement, an official examination result, or general proficiency. |
| Optional AI text review | Four integers from 0–5: task, clarity, grammar, and vocabulary. Overall score = **5 × their sum**, ranging from 0–100. | Audio assessment, a probability, or a validated CEFR/speaking score. |
| Leaderboard points | **10 × saved completed activities + 20 × completed lessons** for each local profile. | Verified identity, an online class position, or a ranking of English ability. |
| Achievement badges | Recorded participation and milestones. | Professional qualifications or language certificates. |

Phrase comparison handles missing/extra words, word order, punctuation, case, common contractions, small whole numbers, and literal clock times. It can align twelve with 12 and three thirty with 3:30 without guessing a 12/24-hour conversion. The UI distinguishes a **typed text match** from a **speech transcript match**. Recognition may mishear understandable speech; a correctly typed sentence does not demonstrate spoken performance.

AI rubric ratings concern the submitted text for its prompt and requested teaching level. For example, 4 + 5 + 5 + 4 yields 90/100. A short but complete answer can score well, and an off-topic answer can still be grammatical; the criteria are independent. The updated Worker requires all four valid fields and does not invent missing ratings. A compatible client may show written feedback from an older endpoint without displaying a score. Conversation replies do not contain these rubric ratings.

## Local profiles, saving, and privacy

### Storage and migration

The `assets/storage.js` module maintains up to **8 local profiles**, separating their preferences, completed progress, notes, and drafts. The collection uses the `english-coach.device.v2` storage-key prefix, scoped by the site's base pathname. The app's own collections therefore remain separate across repository paths on a shared origin. This namespacing does not provide authentication or make a shared browser private.

The normal return path is the same browser and deployment URL. Another device, browser, scheme, host, or base path can expose a different local collection. Navigating among hash routes within one deployment does not create a new collection. There is no cloud synchronization or teacher administration database.

Legacy `english-coach.v1` data is migrated non-destructively; the old entry is retained. Valid version-1 progress backups remain importable. The backup format intentionally stays at version 1 even though the local multi-profile collection is a newer storage structure.

### Stored data and export scope

| Data | Local storage behavior | Export behavior |
|---|---|---|
| Display name and preferences | Separate for each profile | Current profile only |
| Completed lesson IDs and activity summaries | Saved on activity completion | Current profile only |
| Learning notes | Automatically saved during editing | Included |
| Unfinished speaking/pronunciation text | Automatically saved as separate local drafts | **Excluded** |
| Complete conversation history | Not persisted as a conversation transcript | Excluded |
| Raw audio | The app does not create audio recordings | Excluded |
| AI classroom access code | Memory only for the current visit | Excluded |

Activity summaries can include activity type, timestamp, duration, label, input source, word count, and applicable result metadata. Anything the learner writes explicitly in saved notes becomes part of those notes. A draft's presence does not count as a completed activity.

An export includes only the selected profile. Import asks for confirmation, replaces that profile's saved state, and clears its drafts; it does not merge histories or overwrite other local profiles. Reset also clears the selected profile's saved state and drafts after confirmation. Export each profile separately to preserve the whole local collection.

The normalization layer rejects unsupported backup versions and invalid structures, bounds records, and handles invalid dates, duplicate activities, and unwanted fields. At most the newest 1,000 activity records are retained per profile; the visible activity table shows the most recent 30. Active time pauses while the page is hidden or after inactivity and contributes to progress when an activity is completed.

The UI exposes save status on `#/device` and reports write failures. A blocked or failed write must not be labelled saved. Local edits in multiple open tabs can conflict; browser storage does not supply the guarantees of a synchronized account service. Exported backups provide an independent recovery/transfer copy. No permanent-storage guarantee is made.

### Speech and AI data

Browser recognition may process audio through the browser vendor's service; the app explains this alongside the microphone and in Help. Learners can type instead and edit the transcript before requesting feedback. Optional AI sends submitted text, the prompt, and relevant recent conversation context to the configured Worker and AI provider. The backend receives text, not raw audio.

The shared classroom code is kept in memory and omitted from exports. Local learner profiles are not passwords or server identities. Hosting, browser-speech, and API providers may maintain their own records; the app itself adds no advertising, analytics scripts, remote fonts, or third-party image requests.

## Offline and mobile behavior

The full hosted edition includes `manifest.webmanifest`, `sw.js`, and local installation icons. The `assets/device.js` module coordinates offline, installation, and persistent-storage status. On GitHub Pages HTTPS, the service worker prepares a cached copy of the core learning app after its first complete online load. Offline use depends on that cache finishing successfully; a first visit without a connection cannot create it.

Once ready, cached lessons, prepared scenarios, quizzes, text checks, and local profile features can be reopened offline. Optional AI needs its network endpoint. Browser recognition and some voices may also require internet access. Installing the app or adding a home-screen shortcut does not supply a separate copy of progress.

The service worker caches an explicit list of public app files. Learner work stays in the profile store; API calls, POST requests, cross-origin requests, query-bearing requests, and requests carrying the checked authentication headers are excluded from the shell cache. A waiting app update is applied by the learner rather than silently replacing an active learning session.

Installation availability and prompts vary by browser. The persistent-storage request may be accepted or declined according to browser rules. Even accepted persistence does not protect against the user clearing site data. See [MDN's installation guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) and [StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).

The standalone HTML contains the core code and material for convenient local use. Its file-URL storage behavior varies by browser and may change when the file moves. For regular mobile use, the full GitHub HTTPS deployment offers a consistent URL and the hosted offline mechanism. Export/import transfers progress; opening another file or URL does not perform account synchronization. [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

## Optional AI security and deployment

The optional Cloudflare Worker implements `POST /coach` in `feedback` and `conversation` modes. It uses fixed server instructions, strict structured output, and a second response-validation step. The updated feedback schema requires the four 0–5 integer criteria. Malformed or absent provider scores are errors, not occasions to generate substitute scores.

Provider credentials stay in Worker secrets. The public frontend configuration contains an endpoint and optional contact address. Server access requires a separate classroom code, an exact origin allowlist, and two rate-limit bindings. Body and text limits remain 24 KiB for the request, 4,000 characters for current text, and 12 prior messages of no more than 1,000 characters each. The prompt and scenario limits are 1,600 and 600 characters. Unknown properties and privileged message roles are rejected.

Timeouts, provider errors, refusals, invalid output, and missing configuration are returned explicitly. A failed AI request leaves the learner able to use guided practice. The classroom code is a shared access gate, not individual login. GitHub repository paths share their account's origin, so an origin allowlist cannot distinguish those paths. The path-scoped local profile collection does not change that CORS fact.

Cloudflare's example limits are approximate per location and do not form a strict worldwide spending cap. The Worker does not write learner text or model output to a database. Provider service-level retention remains subject to the provider's policies. Full setup, secrets, rate limits, schemas, and troubleshooting remain in [the backend guide](../server/README.md).

## Interface work retained in version 2

The earlier mobile revision introduced a dark emerald/lime palette, a five-item bottom navigation, safe-area spacing, larger touch controls, and 16px form inputs. The drawer makes background content inert, locks background scrolling, handles keyboard focus, and restores focus to its opener. All overview recommendations remain available. Phone pronunciation navigation uses a compact selector, and settings use a scrollable dialog.

Earlier browser review recorded working core routes, text-based practice, lesson completion, a full role play and quiz, backup handling, repository-subfolder navigation, and standalone initialization. A targeted review darkened helper colors that fell below the intended normal-text contrast. These historical observations explain the retained design decisions; they are not a complete accessibility certification or a version 2 regression result.

## Version 2.0.0 verification record

**Recorded on 5 November 2026.** The final command results were:

| Command | Result |
|---|---|
| `npm run check` | Passed: 7 scripts; 13 lessons, 7 role plays, 14 phrase exercises, and 35 quiz questions. |
| `npm test` | **75 passed, 0 failed**: 12 core tests, 26 storage tests, 26 mocked-backend tests, and 11 offline/device/build tests. |
| `npm run build` | Passed; generated the static site and worker with an asset-content hash. |
| `npm run standalone` | Passed; generated the self-contained HTML edition. |

Storage tests cover migration, corruption, write failures, and recovery, including cleared/deleted profile data in recovery copies. These conditions were exercised in automated tests, not injected browser scenarios. Backend tests use mocked provider responses and rate-limit bindings. Offline/device/build tests cover the implementation with mocks; they do not establish an actual HTTPS installation, persistence grant, or offline browser navigation.

The following behavior was observed in the browser preview:

| Browser check | Observed result |
|---|---|
| Draft and note restoration | Reload restored the food lesson's speaking draft and notes containing both English and Thai. Draft restoration was specific to the selected practice topic. |
| Local profiles | Creation and switching kept learner content separate. Completed guided speaking practice updated the selected learner's local participation ranking. |
| Thai guidance | The guidance toggle showed and hid the Thai explanations. |
| Stale-tab conflict | Editing from a stale tab produced a visible save error. The downloaded export retained that tab's unsaved notes. Explicitly reloading saved data recovered the other tab's saved notes. |
| Backup import | The downloaded JSON was imported into a new local profile. Its name, notes, and activity were verified, while the two other profiles remained available. |
| Café role play | All four learner turns advanced through turn labels 2, 3, 4, and Completed. The finished activity appeared in history. |
| Standalone HTML | The served standalone file initialized and showed “Self-contained file” on the device page. This was not a physical-phone file-opening test. |
| Repository-subfolder fixture | A deep route and reload worked under `/__qa_repo/`. That site path used a separate local profile collection. |
| Narrow phone layout | At 320 × 640, all ten reviewed main/new pages had no measured document-wide horizontal overflow. |
| Other responsive layouts | Overview, Profiles, Saving & offline access, Explore the coach, and Leaderboard views had no measured document-wide horizontal overflow at 390 × 768, 600 × 768, 768 × 768, 1280 × 768, and landscape 844 × 390. |
| Short settings dialog | At 390 × 420, the settings body scrolled while the Save/Cancel footer remained visible. |
| Mobile drawer | Opening More established modal navigation and kept focus inside the drawer. |

The final source/copy review also corrected the local-file offline-status wording, draft exclusions in destructive-action prompts, AI rubric notation in history, fixed-fact scenario guidance, and the identified Thai/ranking text contrast combinations. This was targeted review, not a complete accessibility conformance certification.

**Runtime limits:** the preview used insecure HTTP. Actual HTTPS offline navigation, installation prompts/grants, and persistent-storage grants were not browser-tested. Physical iOS/Android devices, operating-system keyboards, real microphone transcription/playback, live AI credentials, and Cloudflare deployment were not exercised. No GitHub deployment was published. Mocked tests and controlled viewport measurements must not be read as verification of those external environments.

**Deployment archive check:** Passed: the 31-file ZIP passed CRC/integrity checks and every archived source byte matched the final project; START_HERE.txt matched the deployment guide. The archive includes the manifest, service worker, icons, storage/device modules and GitHub Actions workflow, and excludes temporary preview fixtures, generated dist output, local hosting settings and browser test data. The standalone file matched the generated all-in-one output. No live credentials are configured in the shipped client.

## GitHub deployment design

The static entry point, `manifest.webmanifest`, and `sw.js` belong at the deployment root beside the complete `assets/` directory. Relative paths and hash routing support `username.github.io/repository/` without server rewrites. The service-worker registration and manifest must retain the repository scope when deployed under a project path.

Publish from `main` at the repository root, or choose the included GitHub Actions workflow. The workflow validates, tests, builds `dist/`, and deploys that output. The build copies the manifest, service worker, and icons with the page and scripts, and adds an asset-content hash to the generated worker's cache version. For raw branch deployments, the owner must change `CACHE_VERSION` in `sw.js` when any cached shell asset changes so existing installations can receive a new edition.

Node.js is needed only for local development commands; branch-based publishing and ordinary use require no local runtime installation. The optional Worker is hosted separately and is not executed by GitHub Pages. See [README deployment instructions](../README.md).

## Primary references

The following documentation supports the hosting and browser/API behavior discussed above. Content counts, source defects, and local application design come from the supplied attachment and project source. Storage, installability, and GitHub publishing-source references were rechecked on 5 November 2026.

- [GitHub Pages overview: static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub: configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [MDN: making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [MDN: StorageManager.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
- [MDN: localStorage and file/origin behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [MDN: speech-synthesis voiceschanged event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event)
- [OpenAI: structured outputs in the Responses API](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI: API data controls](https://developers.openai.com/api/docs/guides/your-data)
- [Cloudflare: rate-limit bindings and accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
