# Case Management capture sources

Captured October 24, 2026 from the correct repository, [jmramons-coder/case-management-platform](https://github.com/jmramons-coder/case-management-platform), pinned at **`d58b51fa981664a533a8c9fe135a4254e952275f`**. The local checkout is `work/case-management-platform/`. This is the Supabase-backed Amplify Case Management application, with the authored William H. Tower underwriting scenario and Galia assistant.

## Rendering the exact application

The public deployment, `https://case-management-platform-five.vercel.app/`, returned HTTP 200 and showed the Equisoft / amplify Case Management login screen. No production sign-in was attempted and no credentials were entered or inspected.

The pinned source provides `VITE_BYPASS_AUTH=true` in `src/app/features/auth/components/LoginGate.tsx` as an explicit development option. The unmodified checkout was served only on loopback:

```bash
npm ci --ignore-scripts --no-audit --no-fund
VITE_BYPASS_AUTH=true npm run dev -- --host 127.0.0.1 --port 3003 --strictPort
```

The existing Vite configuration resolves its design system through the checked-in `vendor/design-elements/bundle.js` fallback when the sibling file dependency is unavailable. No authentication component, product component, fixture, database row or design-system bundle was edited to obtain the captures. No migration, seeding, scenario-application or rebuild script was executed. The source checkout remained clean at the pinned commit.

The source's `CurrentUserProvider` and `ProfileSwitcherList` explicitly implement demo-persona selection using browser-local state and `case_mgmt_current_user_id` in localStorage. Natalie was selected for the underwriting case views. The optional operations overview uses the native Operations Supervisor persona. These choices changed only the isolated browser's local preference; no admin setting or database identity record was written.

## Read-only capture boundary

Each capture used a fresh, isolated headless Google Chrome context, without an existing signed-in profile. Browser routing was installed **before navigation** and permitted only GET, HEAD and OPTIONS. All POST, PATCH, PUT, DELETE and other write methods were aborted. External WebSockets were also closed; only the loopback Vite development connection was permitted. No authorization headers, credentials or secret environment values were read or printed.

The app attempts to create an assistant conversation automatically during startup. Those POST requests to `assistant_conversations` were blocked before reaching Supabase. This does not mean the original application is read-only: it has a real persisted backend. The restriction belongs to the capture session, not to the product's architecture.

Navigation was limited to read-only views: dashboard, case tabs, task detail, requirement detail, its embedded received-document preview and the Galia panel. No task was completed or reopened, requirement ordered or uploaded, decision submitted, message sent, scenario reset, settings saved, document deleted or database content changed. No assistant prompt was submitted. Browser contexts were closed after capture.

## Authored scenario versus current persisted demo

The identity and provenance of the selected case are established by the pinned repository:

- `scripts/rebuild-william-tower.ts` explicitly describes rebuilding the **William Tower demo case**, preserves reference `CS-IN-549019`, selects Natalie and validates the canonical authored scenario. It was read, not run.
- `docs/import/request-types/life-new-business-large-face-amount/life-new-business-large-face-amount.scenario.json` authors William H. Tower, Tower Ridge Electric, the buy-sell purpose, Natalie's financial-review task and the deliberately missing partner statements at the opening handoff.
- The matching native interface shows **`CS-IN-549019 · William H. Tower`**, **Individual Life New Business — Large Face Amount**, Natalie and the same authored business/financial context.
- The README identifies the application as a demo/validation-stage build. Its seed/scenario material establishes that the pictured case, evidence documents and operational examples are demonstration content, not newly accessed customer records.

The captured Supabase demo is **not the pristine opening scenario**. At capture time it contained 17 requirements and 13 documents; the financial-review task was already completed and its history showed earlier demo interactions. Some requirements were ordered, while others remained not ordered. The captures preserve this state exactly. No counts, statuses, dates, findings or task history were rewritten to make the opening story look untouched.

The portfolio's separate guided interaction reconstructs the **authored financial-review opening** as a clearly labelled local study. It is not a replay of the current persisted database. Captions for the native screenshots should say **current demo state** or **application capture using demonstration data**. Figures in the personal and operations dashboards are demo-interface content, not measured product outcomes or verified carrier performance.

## Galia capture scope

The assistant in this pinned version is named **Galia**, as defined in `src/app/features/assistant/lib/agents.ts` and shown by the native interface. The capture opens Galia alongside the active William case, showing the case reference, source-generated opening greeting, suggested question and empty composer.

No question was sent, no fresh external/model reply was generated for this capture, and conversation-persistence writes were blocked. The image demonstrates the contextual assistant interface; it does not verify a live Claude response, financial reasoning accuracy or production integration. The current source selects a model-backed reply path with deterministic fallback; a runtime model response was not verified. See the product analysis for that implementation evidence.

## Full native captures

All raw captures use a **1600 × 1000 CSS-pixel viewport, device scale 1**. PNG originals and read-only inspection logs are in `outputs/case-management-correct/`. WebP derivatives use Pillow quality 94, with no resizing, text repainting, recoloring or UI reconstruction.

| Portfolio asset                                      | Raw PNG                      | Native state                                                                                                                                              |
| ---------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/case-management-platform/workspace.webp`           | `08-task-detail.png`         | Case Tasks table remains visible behind the selected **Review financial data** task panel. Its current Completed status and native history are preserved. |
| `/case-management-platform/case-overview.webp`       | `04-case-overview.png`       | William case, General information, current Insight, stage tracker and related tabs.                                                                       |
| `/case-management-platform/requirements.webp`        | `05-requirements.png`        | Current requirement table with ordering source, received/due dates and statuses.                                                                          |
| `/case-management-platform/requirement-detail.webp`  | `09-requirement-detail.png`  | **Audited financial statements** opened beside the case requirement table; native What arrived finding and received-document preview.                     |
| `/case-management-platform/assistant.webp`           | `07-assistant-panel.png`     | Galia beside the active case Tasks view; opening greeting/context, suggested question and empty composer. No submitted prompt.                            |
| `/case-management-platform/dashboard.webp`           | `03-dashboard-natalie.png`   | Natalie's personal-work dashboard, priority work and current demo case health.                                                                            |
| `/case-management-platform/operations-overview.webp` | `10-operations-overview.png` | Native Operations Supervisor **Underwriting Operations** view: manager brief, application flow, work complexity and seeded/demo analytics.                |

Every full image is 1600 × 1000. `CaseScreens` uses Task / Case / Requirements / Galia / Overview choices; Overview selects `operations-overview.webp` with the supervisor caption. The hero uses `workspace.webp`. The standalone requirement-detail full image and Natalie personal dashboard are additional genuine views retained separately.

## Legible panel crops

These are rectangular crops of the same native PNGs at WebP quality 95. The actual side panels were measured at `x=880, y=48, width=720, height=952`. Cropping preserves all pixels within that panel; it does not invent a different interface state.

| Portfolio asset                                              | Dimensions | Source crop, `(left, top)–(right, bottom)`                                                                                                 |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/showcase/case-management-platform/task-detail.webp`        | 720 × 952  | `08-task-detail.png`, `(880,48)–(1600,1000)`.                                                                                              |
| `/showcase/case-management-platform/requirement-detail.webp` | 720 × 952  | `09-requirement-detail.png`, `(880,48)–(1600,1000)`. Includes the genuine financial-evidence finding and native embedded document preview. |
| `/showcase/case-management-platform/assistant-detail.webp`   | 720 × 952  | `07-assistant-panel.png`, `(880,48)–(1600,1000)`. Galia context/composer, not a newly requested answer.                                    |

The homepage's Task / Requirement / Galia controls use these panel crops. The case-study requirement figure uses the requirement crop. The prepared files use the new `case-management-platform` directories to keep this exact repository's media distinct from retired captures of a different prototype.

## Verification and presentation limits

- All selected native screenshots were opened for visual inspection, including task, requirement, assistant, personal dashboard and operations dashboard. Output dimensions and source-crop coordinates were checked after encoding.
- Final capture logs report no browser page errors or failed HTTP responses. Blocked automatic conversation-creation POSTs remain recorded as blocked attempts, not successful writes.
- `outputs/case-management-correct/asset-manifest.json` records every derivative, raw PNG source, dimensions, byte size, crop coordinates where relevant and source SHA-256. Raw captures and working inspection JSON remain outside the public asset tree.
- Findings, generated briefs, sample PDF contents, task statuses and demo analytics are presented as authored/current demonstration state. They are not independent factual, medical, financial or performance claims.
- Product limitations, the model-backed reply path with deterministic fallback and proposed integrations remain separate from observed native UI. A runtime model response was not verified. See [Case Management product analysis](case-management-product-analysis.md) for implementation evidence.
- These capture checks do not claim a new production deployment or end-to-end validation of live integrations. Root owns the portfolio's final layout, build and browser verification.

## Portfolio verification

Completed October 24, 2026 against the corrected source and the local optimized production preview on port 3001. The user story is homepage card → case study → native screen inspection and local financial-review walkthrough. The portfolio serves prepared static captures; the walkthrough changes React state and does not connect to the source application's backend.

- `npm run build` passed, including TypeScript and generated Open Graph/Twitter images. Targeted ESLint passed for the case-study page, screen viewer, journey, social images and homepage showcase. The repository-wide lint baseline has unrelated existing CommonJS `require` errors in `tests/analytics.test.cjs`; it is not claimed as passing.
- Production browser checks at 320, 390, 768, 1024 and 1440 pixels found no page horizontal overflow, missing main-content images, duplicate IDs or runtime exceptions. All five screen selections and three homepage crop selections loaded their correct new media. The 16-piece homepage registry remains intact.
- Inspection opens the shared gallery, moves to another image, closes with Escape and returns focus to the opener. Desktop, full-page, mobile and homepage-card screenshots were visually reviewed. The native Operations Supervisor capture is the selected Overview view.
- Separate walkthrough checks at 320, 390, 768 and 1440 verified its authored opening state, two rows prepared exactly once, attributed simulated receipt, open review/case, keyboard tabs and focus, Reset, pause and reduced motion. No source-backend request was made. These checks exercise the portfolio reconstruction, not production task execution.
- Local and LAN case-study requests, Open Graph and Twitter image routes returned HTTP 200. Production is bound to `0.0.0.0:3001`; the verified LAN address is `192.168.2.12`. The same-network phone URL is `http://192.168.2.12:3001/case-management` while this computer and preview remain running.
- Results and screenshots are under `outputs/case-management-correct/`, including `portfolio-qa.json` and `journey-qa.json`. Wrong-source public images were removed from the served tree and retained only under ignored `work/retired-case-study/`. Temporary capture and development servers were stopped; the production preview remains running. No public deployment or Git commit was made for this correction.
