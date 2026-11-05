# Optional AI coach backend

The main website works on GitHub Pages without this folder being deployed. Guided conversations, lessons, quizzes, browser speech features, and local progress do not need an OpenAI account.

Deploy this small Cloudflare Worker separately if you want model-generated feedback, text-review scores, and conversation replies. GitHub Pages serves the frontend; the Worker keeps the OpenAI API key on the server and calls the OpenAI Responses API. The frontend sends text only to this endpoint. This backend does not receive audio and does not grade pronunciation or assign a proficiency level. Its rubric scores are formative feedback on the submitted text, not a validated proficiency assessment.

## Verification status

The endpoint has 26 passing automated tests using artificial credentials, mocked responses, and mocked rate-limit bindings. Tests cover successful feedback/conversation, score bounds and types, missing/extra score fields, authorization, exact origins, malformed and oversized input, role injection, rate limiting, provider failures, refusals, output validation, and timeouts. Tests make no network requests.

**No real OpenAI request or Cloudflare deployment was performed when preparing this project.** Your own account access, chosen model, configured secrets, and deployed Worker must be checked after setup. A passing mocked test is not proof that a live account has API access or billing configured.

## Files

| File | Purpose |
|---|---|
| `worker.mjs` | Dependency-free Worker endpoint, `POST /coach`. |
| `wrangler.jsonc.example` | Deployment configuration to copy and personalize. Contains no secrets. |
| `worker.test.mjs` | Node.js tests; no account, dependency install, or API key needed. |

## 1. Prepare your accounts and tooling

Use a current Node.js LTS installation, a Cloudflare account with Workers available, and your own OpenAI API project with access to the selected model. API usage and hosting may incur charges according to your accounts.

The example uses Wrangler 4 through `npx`. The rate-limit binding requires Wrangler **4.36.0 or later**. Check the installed version before proceeding:

```sh
npx wrangler@4 --version
```

Commands below run from this `server` folder. They are setup instructions for the owner; they have not already been executed for you.

## 2. Copy and edit the configuration

On macOS/Linux or Git Bash:

```sh
cp wrangler.jsonc.example wrangler.jsonc
```

On Windows PowerShell:

```powershell
Copy-Item wrangler.jsonc.example wrangler.jsonc
```

Edit `wrangler.jsonc`:

- Give `name` a suitable Worker name.
- Set `ALLOWED_ORIGINS` to the exact frontend origin. If the site URL is `https://yourname.github.io/english-speaking-coach/`, the origin is **`https://yourname.github.io`**. Do not include the repository path or a trailing slash.
- For multiple approved origins, separate them with commas. For example, `https://yourname.github.io,https://english.example.org`. Wildcards are rejected. A local origin such as `http://localhost:8080` is allowed only when explicitly listed.
- Keep both `ratelimits` bindings. Their names must remain `COACH_RATE_LIMITER` and `COACH_CLASSROOM_LIMITER`. Choose two distinct positive-integer namespace IDs that are not already used for other limits in your Cloudflare account.
- `OPENAI_MODEL` defaults to `gpt-5.4-mini`, verified in the official model documentation on 5 November 2026. You may choose another model that your project can use and that supports Responses API structured outputs. The model is configured on the server, not supplied by the learner.
- `RESPONSE_TIMEOUT_MS` defaults to `20000` and must be between `5000` and `45000`. The frontend timeout should be longer than this value.

All GitHub project sites belonging to one account share the same `https://yourname.github.io` origin. CORS cannot distinguish their repository paths. The separate classroom access code is therefore still required.

## 3. Deploy the Worker and add server secrets

Sign in and create the Worker with the configured source:

```sh
npx wrangler@4 login
npx wrangler@4 deploy
```

At this point, AI requests return `503 not_configured` until the two secrets below are set. This is intentional: the service never falls back to unauthenticated, unlimited provider use.

Add your OpenAI API key as a Worker secret. Wrangler prompts for the value interactively:

```sh
npx wrangler@4 secret put OPENAI_API_KEY
```

Create a long random classroom code, for example with a password manager. It must contain **24–256 letters, digits, underscores, or hyphens**. A random 32-byte base64url value is suitable. Save it securely, then add it through the interactive prompt:

```sh
npx wrangler@4 secret put COACH_ACCESS_TOKEN
```

`wrangler secret put` deploys an updated Worker version. Keep the values out of source files, `vars`, screenshots, GitHub, and frontend configuration. The OpenAI API key must never be given to students or entered into the website. Students receive only the classroom code.

A shared classroom code is an access gate, not individual student authentication. Anyone who knows the code can use the endpoint and consume API usage. Rotate it when needed; for a broad public service, replace the shared gate with individual sign-in and appropriate per-user limits.

## 4. Connect the website

Use the Worker URL printed by Wrangler and append `/coach`, for example:

```text
https://english-speaking-coach-api.your-subdomain.workers.dev/coach
```

Set `aiEndpoint` in the website's public `assets/config.js` file to this full endpoint URL. Then open the website's profile/settings panel, enable AI for the current visit, and enter the classroom code in its access-code field. The browser keeps that code in memory only, so a page reload requires re-entry. No API key belongs in either the frontend configuration or these settings.

The HTTP request must use:

```text
POST /coach
Content-Type: application/json
Authorization: Bearer <classroom access code>
Origin: <browser supplied frontend origin>
```

The browser supplies `Origin`; JavaScript should not try to set it. For cross-origin requests, the Worker handles the browser's `OPTIONS` preflight and allows only `POST`, `Content-Type`, and `Authorization`.

## Request and response contract

A feedback request:

```json
{
  "kind": "feedback",
  "level": "A2",
  "prompt": "Introduce yourself to a new classmate.",
  "text": "I study engineering. I enjoy reading."
}
```

A successful response contains:

```json
{
  "feedback": "You used two clear sentences.",
  "suggestion": "Add one question: What do you enjoy?",
  "scores": {
    "task": 4,
    "clarity": 5,
    "grammar": 5,
    "vocabulary": 4
  }
}
```

The updated Worker requires all four score fields, each an integer from **0 through 5**, with no additional score fields. `feedback` and `suggestion` remain non-empty strings of at most 1,800 characters each. Invalid or missing provider scores return `502 invalid_provider_response`; the Worker does not invent, round, clamp, or fill in ratings.

| Criterion | What the model reviews in the submitted text |
|---|---|
| `task` | Whether the answer addresses the prompt and respects supplied scenario facts. |
| `clarity` | Whether the meaning is understandable and the ideas follow a logical order. |
| `grammar` | Whether sentence patterns are appropriate and accurate. |
| `vocabulary` | Whether words are accurate, suitable, and sufficient for the task. Advanced words are not required for a high score. |

The fixed rubric uses **0** for no usable evidence, **1** for very limited evidence with serious problems, **2** for a partly effective response with frequent problems, **3** for a mostly effective response with some problems, **4** for an effective response with minor problems, and **5** for a fully effective response for this task and requested teaching level. The model scores each criterion independently: an off-topic sentence can still be grammatical, and a short complete answer can score highly. The level supplied in the request guides teaching; it is not a measured learner level.

A client may derive an overall text-review score out of 100 with equal weighting:

```js
const total = 5 * (scores.task + scores.clarity + scores.grammar + scores.vocabulary);
```

For the example above, the total is **90/100**. This is a normalized rubric total, not a percentage of correct words, a probability, or an exam result. The server returns the four criteria rather than a second independently generated total.

These scores concern only the submitted text. They do not measure pronunciation, accent, spoken fluency, CEFR proficiency, or audio quality. If the text came from speech recognition, any transcription errors become part of the text being reviewed; learners can edit it before submission. The ratings are formative, model-generated feedback and have not been validated as a proficiency test.

For compatibility with an older endpoint, clients may accept a feedback response without `scores` and show its written feedback alone. They should never substitute made-up AI ratings for a missing score object. New versions of this Worker always require the complete score object for a successful feedback response.

A conversation request may also include `scenario` and previous `messages`:

```json
{
  "kind": "conversation",
  "level": "A1",
  "prompt": "Practise ordering a drink politely.",
  "scenario": "At a cafe",
  "text": "I would like a tea, please.",
  "messages": [
    { "role": "assistant", "content": "Hello! What would you like?" }
  ]
}
```

Its successful response has a non-empty `reply`. It may also contain `feedback` and `suggestion`. Conversation responses do not contain scores; their contract is unchanged. These examples illustrate the format; actual wording and text-review scores come from the configured model.

| Input | Limit |
|---|---|
| Entire UTF-8 request body | 24 KiB (24,576 bytes), checked while reading. |
| `kind` | `feedback` or `conversation`. |
| `level` | `A1`, `A2`, or `B1`; a requested teaching level, not an assessed proficiency. |
| `prompt` | Non-empty string, at most 1,600 JavaScript string characters. |
| `text` | Non-empty string, at most 4,000 characters. |
| `scenario` | Optional string, at most 600 characters. |
| `messages` | Optional array of at most 12 previous turns. |
| Each message | `role` is `user` or `assistant`; non-empty `content`, at most 1,000 characters. |

Unknown properties and privileged roles such as `system` are rejected. Include the latest learner turn in `text`, not a second time in `messages`. Send at most 12 prior messages, shortening each history item to at most 1,000 characters. The frontend may use the latest coach question as `prompt`, capped at 1,600 characters. A practice role play ends after the fourth learner response: when history contains three prior user turns, the server instructions request a closing reply and a brief tip, without another question. The fixed server instructions treat all user-supplied fields as untrusted practice data; they cannot select a model, tools, API endpoint, or output schema.

The Worker requests a strict JSON schema, validates the returned structure again, and enforces a 1,200-token output budget. It does not automatically retry provider calls. Learner text and model output are not written to a database by this Worker. It sends `store: false`; this does **not** mean that the API provider has no service-level retention. Consult your provider's data controls for your account.

## Rate limits and usage

Both bindings are required. The example allows approximately 60 authenticated requests per minute per IP and 180 per minute on a shared classroom key. Students on the same school network may share an IP allowance. Adjust these values for your class size and budget.

Cloudflare's rate-limit bindings are approximate and maintained per Cloudflare location. These values are **not a strict worldwide spending cap**. Set suitable limits and alerts in your API project as well; strict global request accounting would require an additional coordinated service such as a Durable Object. Raw client IPs are hashed before use as limiter keys. This Worker does not log request bodies, secrets, or model responses.

## Errors and troubleshooting

Failures are JSON objects with `error` and `message` fields. The frontend should show the message and keep guided practice available. It must not invent a successful AI response when a request fails.

| Status | Typical meaning | Check |
|---|---|---|
| 400 | Invalid JSON or request fields | Input limits, level, role names, and required strings. |
| 401 | Missing or incorrect classroom code | Re-enter the code; never substitute an OpenAI API key. |
| 403 | Origin or preflight is not allowed | Exact `ALLOWED_ORIGINS`; exclude the repository path. |
| 404 | Wrong URL | The endpoint must end in `/coach`. |
| 413 | Request is too large | Shorten text or conversation history. |
| 415 | Wrong request content type | Send `application/json`. |
| 422 | Provider declined the request | Try another English-practice example. |
| 429 | Classroom/client rate limit reached | Wait at least one minute. |
| 502 | Provider failure or invalid/incomplete output | Teacher checks provider access, model, usage, and settings. |
| 503 | Missing configuration, unavailable limiter, or provider allowance issue | Teacher checks Worker secrets/bindings and API account. |
| 504 | Provider timeout | Retry later or continue guided practice. |

A blocked origin may appear to browser code as a generic network error because the Worker deliberately sends no CORS permission to that origin. Never solve this by using `*` or removing authentication.

After deployment, try one ordinary feedback request from the approved website, then one conversation. Confirm that the displayed reply is returned by the configured endpoint, that a wrong classroom code fails, and that guided mode remains usable when disconnected. These live checks use your own accounts and can incur API usage.

## Run the automated checks

From the repository root:

```sh
node --test server/worker.test.mjs
```

Or from this folder:

```sh
node --test worker.test.mjs
```

No real credentials are needed. Do not replace the artificial test fixtures with your secrets.

Keep local deployment and secret files out of version control, including `server/wrangler.jsonc`, `.dev.vars*`, `.env*`, `.wrangler/`, and `node_modules/`. The committed example remains safe to share.

## Official references

Checked on 5 November 2026:

- [OpenAI structured outputs for Responses](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI GPT-5.4 Mini model capabilities](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
- [Cloudflare Workers rate-limit bindings and accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
