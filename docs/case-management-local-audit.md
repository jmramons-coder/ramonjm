# Case Management: current source and historical media audit

Updated October 24, 2026 after the user identified the correct repository. This audit distinguishes the current application from historical material and the previously mistaken sandbox. It does not establish production deployment, customer impact or research outcomes.

## Verified current identity

- **Correct repository:** [jmramons-coder/case-management-platform](https://github.com/jmramons-coder/case-management-platform).
- **Pinned HEAD:** `d58b51fa981664a533a8c9fe135a4254e952275f`.
- **Current local checkout:** `work/case-management-platform/`. The Git remote and SHA were checked directly. Git CLI could access the exact repository; the connector's different account returned 404 and was not reliable evidence of absence.
- **Product:** Equisoft Case Management, a working demo/validation platform for life/annuity service-request orchestration. Core records persist through Supabase; workflow bundles configure work and scenarios seed prepared examples. External PAS/screening/notification systems are simulated.
- **Current conversational assistant:** **Galia**, from `src/app/features/assistant/lib/agents.ts:4–10,57–70`. Its persisted internal id remains `alex` for conversation compatibility; that id is not the current display name. The current page and captions should use Galia.
- **Detailed product evidence:** [case-management-product-analysis.md](case-management-product-analysis.md), including exact source/line references and README drift.

`jmramon-coder/CM-Multicase_SANDBOX-EQ-JMR` at `4347e1638df56bd06df2b4f79c9f91978a0270c1` is a different repository. The old snapshot remains under `work/case-management-source/` for traceability only. Its fixture-only architecture, Billy Bud/IP26/IT-5197 scenario, document highlights and approval → restoration → meeting flow must not be used as evidence for the requested product. Earlier analysis/captures based on it have been superseded.

## Current implementation boundaries

| Area                 | Verified source boundary                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work and intake      | `src/app/lib/supabase/requests.ts` creates persistent requests/cases/configured work. It is not a fully client-only fixture application and not AI intake.                                                                                |
| Human task execution | Tasks, actions and requirement dependencies have separate meanings. Data-layer completion checks exist. Failed actions can put a task Under Review for explicit human handling.                                                           |
| Context panel        | `PanelStackProvider.tsx` retains recent task/requirement/document/note/decision/assistant contexts within a session, maximum six. Configuration affects visible navigation.                                                               |
| Requirement review   | The current panel shows stored findings or an attributed human note alongside received evidence. A bounded image/native PDF preview preserves surrounding explanation. The earlier sandbox's page-anchor/highlight viewer is not present. |
| Assistance           | Galia's model path is selected with a deterministic fallback. Read-only tools use existing application records/cache. Document tools return metadata and explicitly do not read document contents.                                        |
| Inline guidance      | Record-derived banners and closure recommendations are deterministic. Prepared scenario findings can be persisted. AI styling does not prove live model extraction/inference for these surfaces.                                          |
| Decision             | The side panel keeps the case visible, requires outcome/reason and records the decision without falsely completing other outstanding tasks.                                                                                               |
| Authentication       | A Supabase LoginGate exists; build configuration can explicitly bypass it. README's “none/deferred” wording is outdated. This alone does not establish production authorization readiness.                                                |
| Integration          | PAS confirmation is simulated with a timer. Core state changes are real writes, so source capture should use read-only navigation and avoid seed/create/complete/record/import actions.                                                   |

The current application is not the same artifact as its September film. Use fresh, source-matched screenshots for current UI claims. Capture provenance and any local harness belong in [case-management-asset-sources.md](case-management-asset-sources.md); that workstream must distinguish actual native UI from any explanatory public reconstruction.

## Historical media: same repository, older snapshot

The historical creative brief explicitly names the now-correct repository and deployment:

- `/Volumes/CodexWorkspaceStorage/Documents/Codex/2026-09-09/do-you-see-the-case-management/launch-video/creative-brief.md`: `https://github.com/jmramons-coder/case-management-platform` and `https://case-management-platform-five.vercel.app/`.
- `launch-video/README.md` documents September 9 app captures. `case-launch-v32/README.md` documents refreshed September 11 captures including tasks, cases, requirements, contextual/full assistant and role dashboards.
- Historic screens show Natalie, William H. Tower, `CS-IN-549019`, `TAS-2025-6` and a buy-sell underwriting scenario. This establishes product lineage and a useful historical example, not the exact present database state or UI.
- Any **Alex** display name in historical media belongs to that recording date. Current source names the conversational assistant **Galia**. Do not relabel an unchanged historical film as a current Galia recording.

### Verified final film

`/Volumes/codex-vault/Equisoft Elevate 2026 - Final Videos/equisoft-case-management.mp4`

- 1920 × 1080, H.264, 60 fps container rate, 68 seconds, stereo AAC 48 kHz; **24,897,524 bytes**.
- SHA-256 rechecked October 24: **`c5555c292f530b882175a5992321b76596a5793d8b99b997760bb536d472dd6f`**.
- Previously verified byte-identical September master: `/Volumes/CodexWorkspaceStorage/Documents/Codex/2026-09-11/hey-iwant-to-work-on-the-2/outputs/equisoft-case-management-v81.mp4`.
- Authored provenance: the September 11 workspace's `work/rebuild-kit-case/README.md` and `work/rebuild-kit/stage/equisoft-eight-video-rebuild/films/case-management/provenance/production-v81/README.md`.
- “Approved v81” means the approved editorial master, not a production-product status. The handoff excludes v79/v80; v81 fixed historic Coming soon copy leaking into the final frame.
- The presentation combines native UI captures with camera/pointer motion, animated charts and **code-rendered contextual chat**. `case-launch-v79/promo.py` and `promo_chat.py` in the September 9 workspace document that treatment. Caption it as a **historical product presentation**, not an unaltered current app recording. An encoded 60 fps rate does not establish native 60 fps browser capture.

### Original historic screens

All eight were previously visually inspected and measured at **1920 × 907**. Common source:

`/Volumes/CodexWorkspaceStorage/Documents/Codex/2026-09-09/do-you-see-the-case-management/case-launch-v76/recordings/`

| File                          | Useful historical context                                             |
| ----------------------------- | --------------------------------------------------------------------- |
| `dashboard-opening.png`       | Daily brief, priority work, personal workload and SLA view.           |
| `tasks-start.png`             | Assignment, due date, priority and status in the task queue.          |
| `task-open-current-end.png`   | Task details, actions and linked case beside the queue.               |
| `final-case-open-end.png`     | Related case/workflow context.                                        |
| `requirements-table.png`      | Received/ordered evidence states and ordering provenance.             |
| `requirement-open.png`        | Requirement evidence preview and contextual explanation.              |
| `context-answer-complete.png` | Native historical reply; distinct from later code-rendered film chat. |
| `outro-manager.png`           | Historical manager operational overview.                              |

`case-launch-v79/recordings` resolves through v78 to v76. The portable rebuild kit materializes dependencies instead of relying on symlinks. `case-launch-v32/recording-provenance.json` and per-clip `capture.json` preserve source-frame and geometry information.

## Search coverage and curation

A pruned exact-remote search found no pre-existing matching Git checkout before the fresh clone. The search covered active/archived Codex roots and the three mounted stores, excluding dependency/build caches, sparse images and unrelated private content:

| Root                                                                                                          | Directories traversed | Git configurations inspected | Exact matching checkout found |
| ------------------------------------------------------------------------------------------------------------- | --------------------: | ---------------------------: | ----------------------------: |
| `/Users/codex/Documents/CodexInternalActive-2026-10-05` (also exposed through `/Users/codex/Documents/Codex`) |                 3,514 |                            7 |                             0 |
| `/Volumes/CodexWorkspaceStorage`                                                                              |                 6,231 |                           11 |                             0 |
| `/Volumes/codex-vault`                                                                                        |                15,731 |                           27 |                             0 |
| `/Volumes/CodexBuildArchive`                                                                                  |                26,650 |                            0 |                             0 |

Media search also used `work/asset-audit/media-files.txt`, project-specific September 9/11 archives, final-film folders and Equisoft rebuild packages. The `elevate-sary` package primarily documents later Design/D2C/Group Benefits wrappers; Case Management v81 provenance lives in the September archives above.

Prefer current-source captures for the main case-study walkthrough and genuine historical media only with a dated caption. No source PDFs, credentials or customer documents are needed for this narrative. The product analysis audit was read-only; current UI capture and portfolio implementation are separate workstreams.
