# English AI Speaking Coach

**Version 2.0.0** — a responsive English practice website for A1–B1 learners, with everyday, travel, work/study, and maritime activities, optional Thai vocabulary hints, and an English/Thai feature guide.

The core site uses plain HTML, CSS, and JavaScript. It needs no framework, runtime packages, online account, or AI API key. An optional AI server is supplied separately. The project is prepared for GitHub Pages; no repository or public deployment has been created on your behalf.

**Verified on 5 November 2026:** source validation, all **75 automated tests**, the static build, and standalone generation passed. Browser checks covered the new local profiles, saving, backups, learning flows, and responsive layouts. See [Verification](#version-200-verification) and [the audit](docs/AUDIT.md) for exact results and limits.

## What is included

| Feature | Content and behavior |
|---|---|
| Speaking lessons | **13 original lessons** across everyday, travel, work/study, and maritime English, including a new A2 food-ordering lesson. Each includes an objective, dialogue, prompt, model answer, tips, tasks, and completion checklist. |
| Vocabulary | **78 lesson vocabulary entries**, with simple meanings, examples, and optional Thai hints. Entries may repeat a useful word across lessons. |
| Speaking practice | Topic prompts, supported microphone transcription, an editable response, sentence starters, and clearly labelled guided text checks. Unfinished response text saves automatically. |
| Conversations | **7 guided role plays**, each with **4 learner turns**, including ordering at a café. Optional AI replies require a configured server. |
| Pronunciation practice | **14 phrases** with speaking tips, listening examples, and typed/transcribed word comparison. Unfinished comparison text saves automatically. |
| Knowledge quiz | **35 multiple-choice questions** with explanations. A quiz selects up to 10 questions; filters can yield a smaller set. |
| English/Thai feature guide | `#/features` explains the requested features, actual behavior, and limits in both languages. |
| Local learner profiles | `#/profiles` supports **up to 8 profiles** in this browser and site, with separate preferences, progress, notes, and drafts. Profiles have no passwords or identity verification. |
| Progress and notes | Completed activities, active practice time, a seven-day chart, streaks, results, and automatically saved learning notes. |
| Leaderboard and badges | `#/leaderboard` compares recorded participation among this browser's profiles and shows the selected learner's achievements. No online class or fictional learners are added. |
| Saving and device help | `#/device` shows saving and offline status, backup controls, supported installation/storage options, and bilingual mobile-saving and safe-practice guidance. |
| Offline core | On the deployed HTTPS site, the app's service worker prepares the core site for offline reopening after the first complete online load and cache. |
| Practical controls | Search, category filters, lesson printing, daily goals, US/UK English voice preference, playback speed, JSON backup import/export, and confirmed reset. |

The material is newly authored for this rebuild. The attachment supplied only the original home page; unavailable lesson pages and application services were not recovered. A1/A2/B1 are practice labels, not assessed learner levels. Maritime activities practise language and are not operational training or certification. See [the content and technical audit](docs/AUDIT.md).

## Start on a phone

For regular phone use, publish the complete project to GitHub Pages and keep using the same HTTPS site URL in the same browser.

1. Open the deployed site while online and choose or create your learner profile at `#/profiles`.
2. Try a short lesson or type a practice response. Notes and unfinished speaking/pronunciation text save automatically; completed activities are added to progress when finished.
3. Open `#/device` and check the visible saving and offline status. A failed save is shown as a failure, not as a successful save.
4. After the first complete load and offline preparation, the cached core content can reopen without a connection. The browser's speech services and optional AI can still require internet access.
5. If offered, use installation or Add to Home Screen for convenient access. You may also request persistent storage. The browser can decline either option; neither is a permanent backup.
6. Export a progress backup regularly, especially before changing devices, repository URLs, browsers, or browser settings that remove site data.

Browser installation requirements vary. The storage request asks the browser to retain data and may be refused. [MDN: installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) · [MDN: persistent-storage requests](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).

### Open the local edition

For a quick guided preview, extract the ZIP and open `index.html` beside its complete `assets/` folder, or open the separate `English_Speaking_Coach.html` file. No development server is required for ordinary guided text activities.

Directly opened files have browser-dependent storage behavior, particularly on mobile. Moving or renaming a file may change which local data is available. The standalone edition contains its code and learning content, but it is not the complete hosted PWA package. Use the GitHub HTTPS URL for more consistent phone use, and transfer saved progress with exported backups. [MDN: localStorage and file URLs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

## Deploy to GitHub Pages

Choose **one** publishing method. Extract the ZIP and upload its **contents**, with `index.html` at the repository root. Uploading only the ZIP or leaving an extra enclosing folder prevents the intended entry point from being found.

### Method A: publish from the main branch

This method requires no local Node.js installation or build command.

1. Create a GitHub repository with Pages available. A public repository is suitable for a public classroom site.
2. Upload the extracted files to `main`. Keep **`index.html`, `manifest.webmanifest`, `sw.js`, the entire `assets/` folder, and `.nojekyll` together at the repository root**. The assets include the application scripts and all PNG installation icons. For this method, omit `.github/workflows/deploy-pages.yml`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** and **/(root)**, then save.
6. Wait for the deployment and open the HTTPS URL shown in Pages settings.

A project URL normally resembles `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. Relative asset paths and hash routes such as `#/lessons`, `#/profiles`, and `#/device` support repository subfolders without server rewrite rules. [GitHub: configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Method B: use GitHub Actions

1. Upload or push the complete source, including `.github/workflows/deploy-pages.yml`.
2. Select **GitHub Actions** as the source under **Settings → Pages**.
3. Push to `main`, or run the included workflow manually from **Actions**.
4. Review the checks, tests, build, and deployment result, then open the Pages URL.

The workflow builds the static site into `dist/` and publishes that folder. Node.js runs in the workflow environment; it is not needed on your computer for this method. The generated site must include the root manifest and service worker as well as all assets. [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Check your own deployment

Open the published site online and visit `#/device`. Confirm that saving works and wait for offline readiness before checking an offline reload. Visit a lesson deep link and reload it. Try microphone permission and audio playback on the devices you intend to use; available speech services vary. A successful Pages build does not verify the microphone, installation support, or the optional AI account.

Keep `manifest.webmanifest` and `sw.js` at the same deployment level as `index.html`. Upload the full updated asset set when publishing changes. For subsequent **raw branch deployments**, change `CACHE_VERSION` in `sw.js` whenever a cached page, script, stylesheet, icon, or other shell asset changes. Otherwise an existing installation can continue using its older cached edition. The build used by Method B adds an asset-content hash to the generated worker automatically.

Learners can return online and check `#/device` for an available update. Apply it through the site's update control when offered. Export progress before clearing site data to investigate a stale cache.

## Guided practice, speech, and scores

| Capability | Actual behavior | Interpretation |
|---|---|---|
| Guided mode | Local lessons, prepared conversation turns, target-word checks, and limited text-pattern hints. | No model generates the guided replies. This is practice support, not a comprehensive language assessment. |
| Browser speech | The browser transcribes speech and reads examples aloud where supported. Learners can edit transcripts or type instead. | Voices and recognition support vary. A browser speech service may process audio remotely. |
| Phrase comparison | Compares typed or transcribed words with a target phrase, normalizing punctuation, case, common contractions, small whole numbers, and literal clock times. | A percentage describes a text match. It does not identify acoustic pronunciation errors or measure accent, intonation, spoken fluency, or CEFR proficiency. |
| Quiz | Calculates results from answers in a completed practice quiz. | A quiz percentage is not a placement-test result. |
| Optional AI feedback | A configured server reviews the submitted text for task completion, clarity, grammar, and vocabulary. | Model-generated formative feedback can be mistaken and does not evaluate audio. |
| Local leaderboard | Adds **10 points per saved completed activity**, plus **20 points per completed lesson**. | Participation points are separate from quiz, text-match, and AI rubric scores. They do not rank verified language ability. |

Microphone use begins only when the learner chooses it. Denied permission, unsupported recognition, or a speech-service error leaves typed practice available. The app does not create or store raw audio recordings. [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

### Optional AI text rubric

The updated backend returns four integer criteria, each from **0 to 5**: `task`, `clarity`, `grammar`, and `vocabulary`. The displayed overall text-review score uses equal weighting:

```js
const total = 5 * (scores.task + scores.clarity + scores.grammar + scores.vocabulary);
```

For example, ratings of 4, 5, 5, and 4 yield **90/100**. This is a normalized rubric total, not a probability, word-match percentage, exam result, or measured speaking level. A transcript error can affect the submitted text; edit the transcript before sending it. Missing AI ratings must not be replaced with invented values. Older endpoints may provide written feedback without the new score object. Full response validation and rubric definitions are in [the backend guide](server/README.md).

## Profiles, automatic saving, and backups

Each deployment has a local collection of up to eight learner profiles. Selecting a profile separates its settings, progress, notes, and drafts from the other profiles in that collection. This replaces a misleading online-login promise with an explicit **local profile chooser**. Anyone with access to the same browser can switch profiles; there is no password protection, verified identity, cloud account, or teacher database.

| Data | Saved in the selected local profile | Included in that profile's exported backup |
|---|---|---|
| Display name and preferences | Yes | Yes |
| Completed lessons and activity summaries | Yes | Yes |
| Learning notes | Yes, automatically while edited | Yes |
| Unfinished speaking response and pronunciation comparison text | Yes, automatically | **No** |
| Complete conversation transcripts | No | No |
| Raw audio recordings | Not created by this app | No |
| Classroom AI access code | Memory only for the current visit | No |

Open `#/device` to check saving status. Browser storage can be blocked or unavailable; errors remain visible instead of displaying a false saved state. A saved draft is not a completed activity. Activity time pauses while the page is hidden or the learner is idle, and enters the activity history on completion. An unfinished conversation or quiz is not counted as completed.

### Export and import

Export from My progress, Settings, or the device page. A backup contains **the currently selected profile only**, not the whole collection. Export each profile separately if you want to preserve all learners. Drafts are excluded, so copy unfinished text separately if you need to move it.

The progress-backup format deliberately remains **version 1** and accepts valid existing version-1 backups. Import requires confirmation, replaces the selected profile's saved state, and clears its unfinished drafts. It does not merge histories or replace another local profile. Reset also requires confirmation and clears the selected profile's saved state and drafts.

Backups can contain names and learning notes. Keep them somewhere appropriate for their contents. Browser storage is not guaranteed permanent; private browsing, clearing site data, or storage restrictions can make it unavailable. A separate exported file is the transfer method when changing devices.

### Site URLs and migration

The profile collection is namespaced by the deployment's base path, using the `english-coach.device.v2` key prefix. This keeps the app's own records separate when several copies live at different repository paths on the same host. It is an organizational separation, not an authentication boundary.

Use the same browser and site URL to return to the same collection. A different browser, device, protocol, hostname, or repository path can open a different collection. Hash routes within the same site do not create separate profiles. Existing `english-coach.v1` progress is migrated without deleting the old storage entry. An exported backup also remains available as an explicit migration route.

## Configure real AI or a contact email

Leave `assets/config.js` unchanged for guided mode. To connect AI:

1. Follow [the optional Worker setup guide](server/README.md) and deploy the server separately.
2. Set `aiEndpoint` in `assets/config.js` to the full HTTPS endpoint ending in `/coach`.
3. Allow the exact website origin on the Worker, for example `https://yourname.github.io`, **without** a repository path or trailing slash.
4. Open the website's settings, enable AI for the visit, and enter the classroom access code supplied by the owner.

GitHub Pages serves static files; it does not run the AI Worker. The OpenAI API key belongs only in Worker secret settings. Never put it in frontend code, the repository, or the learner's access-code field. The classroom code remains in memory and clears on reload. A shared classroom code controls server access; it is not individual student authentication.

All GitHub project sites under one account share an origin. The server's CORS allowlist cannot distinguish their repository paths; the classroom access code remains necessary. Failed requests show an error and leave guided practice available. The server and account require live checks with the owner's credentials after deployment.

To provide a real teacher/support link, set `contactEmail` in `assets/config.js`. Leaving it blank retains the help page without a fake contact form or delivery claim.

### Backend contract

The `/coach` endpoint expects JSON and a bearer classroom code. For example:

```json
{
  "kind": "feedback",
  "level": "A2",
  "prompt": "Politely order a dish and a drink.",
  "text": "I would like one rice bowl and a bottle of water, please."
}
```

Feedback responses contain `feedback`, `suggestion`, and the four `scores` criteria. Conversation requests use `kind: "conversation"`; their responses contain `reply` and may include written feedback and a suggestion, with no rubric scores.

The endpoint accepts A1, A2, and B1. Limits remain: 24 KiB for the body, 1,600 characters for `prompt`, 4,000 for current `text`, 600 for `scenario`, and at most 12 prior `messages` of 1,000 characters each. Put the current learner response in `text` only, without duplicating it in history. Frontend field limits do not increase the backend limits.

The server rejects missing configuration, wrong access codes, disallowed origins, invalid requests, and unavailable rate-limit bindings. It validates structured provider output and reports errors instead of fabricating feedback. Cloudflare's supplied rate limits are not a strict global spending cap. See [the server guide](server/README.md) for secrets, limits, exact schemas, and troubleshooting.

## Optional development commands

Use Node.js **22 or newer** to run project checks or generate a deployment folder. No third-party package installation is needed for these scripts:

```sh
npm run check
npm test
npm run build
npm run standalone
```

`npm run build` refreshes `dist/` with the static site, including `manifest.webmanifest`, `sw.js`, and all public assets. `npm run standalone` produces `dist/English_Speaking_Coach.html`; run it after the build because the build refreshes the output directory. The standalone file is a convenient guided edition; use the complete generated folder for the hosted PWA.

The branch-based deployment method does not need a local build. The included Actions workflow runs validation, the current automated suite, and the static build before publishing. Exact results belong to the verification record below, rather than an assumed fixed test count.

## Version 2.0.0 verification

**Results recorded on 5 November 2026.** These results apply to version 2.0.0; automated, browser-observed, and untested behavior are distinguished below.

| Verification area | Version 2.0.0 result |
|---|---|
| Source validation | `npm run check` passed: 7 scripts; 13 lessons, 7 role plays, 14 phrases, and 35 quiz questions. |
| Automated tests | `npm test`: **75 passed, 0 failed** — 12 core, 26 storage, 26 mocked-backend, and 11 offline/device/build tests. |
| Generated editions | `npm run build` and `npm run standalone` passed. The built worker includes an asset-content hash. The served standalone HTML initialized and displayed “Self-contained file.” |
| Saving and profiles | Reload restored a topic-specific food-speaking draft and English/Thai notes. Profile creation and switching kept learner content separate. Completed guided practice updated the local ranking. Thai guidance toggled correctly. |
| Conflict and backups | A stale tab displayed a save error. Its downloaded export preserved unsaved notes; explicit reload recovered the other tab's saved notes. Import into a new local profile restored the exported name, notes, and activity while the other two profiles remained. |
| Café conversation | The new guided scenario advanced through turns 2, 3, 4, and Completed, then appeared in activity history. |
| Responsive layout | No document-wide horizontal overflow was measured at 320 × 640 across ten reviewed pages, or on the new overview/profile/device/feature/ranking views at 390 × 768, 600 × 768, 768 × 768, 1280 × 768, and 844 × 390. |
| Dialog and navigation | At 390 × 420, the settings body scrolled with Save/Cancel visible. The mobile More drawer kept focus inside its modal navigation. |
| Repository path | A deep route and reload worked under `/__qa_repo/`, using a separate local profile collection. |
| Offline mechanism | Service-worker/device/build behavior passed automated mocked checks. Actual HTTPS offline browser navigation was **not** exercised in the insecure HTTP preview. |

Storage migration, corrupt-data handling, and failure/recovery behavior were tested automatically, not by injecting those conditions into the browser. Physical iOS/Android devices, operating-system keyboards, real microphone capture/playback, live AI credentials, HTTPS installation or persistence grants, Cloudflare hosting, and the eventual GitHub deployment were not tested. No GitHub site has been published. The final archive-verification record is maintained in [the audit](docs/AUDIT.md).

## Project files

| Path | Purpose |
|---|---|
| `index.html` | Website entry point and accessible navigation. |
| `manifest.webmanifest` | Hosted app name, icons, launch behavior, and scope. |
| `sw.js` | Service worker for the hosted core site's offline cache. |
| `assets/styles.css` | Responsive layout, controls, colors, and printing. |
| `assets/app.js` | Views, practice flows, speech controls, and optional AI client. |
| `assets/content.js` | Lessons, vocabulary, scenarios, phrases, quiz questions, bilingual feature guide, and help articles. |
| `assets/core.js` | Text checks, progress normalization, metrics, and achievements. |
| `assets/storage.js` | Local profile collection, migration, drafts, and persistence handling. |
| `assets/device.js` | Offline, installation, and browser-storage capability handling. |
| `assets/config.js` | Public endpoint/contact settings; no secrets. |
| `assets/favicon.svg`, `assets/icon-192.png`, `assets/icon-512.png`, `assets/apple-touch-icon.png` | Local site and installation icons. |
| `.github/workflows/deploy-pages.yml` | Optional GitHub Pages workflow. |
| `.nojekyll` | Static branch-publishing marker. |
| `scripts/`, `package.json` | Validation, tests, and dependency-free build commands. |
| `tests/` | App logic and storage tests. |
| `server/` | Optional AI Worker, setup guide, configuration example, and endpoint tests. |
| `docs/AUDIT.md` | Source findings, version 2 behavior, and verification record. |
| `dist/` | Generated deployment output after building. |

Edit source files and regenerate the deployment and standalone editions after changes. The core learning site needs no private keys or paid external assets to display.
