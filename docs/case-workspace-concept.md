# Contextual workflows — interaction study

**Current direction, October 25, 2026.** The user chose to return to this focused interaction study rather than showcase the complete original frontend. The portfolio and `/case-workspace` again render the local concept. The native integration is retained only as an archived reference; its generated frontend is outside the public directory and its routing fallback has been removed.

## Retained object navigation — current

The four type-only tabs have been replaced by a named tab for every opened task, requirement and document, with an individual X. Assistant remains pinned. The selected tab and its clear control scroll into view together, including after drawer resizing and phone breakpoint changes. Tab tooltips and accessible descriptions include the case reference, distinguishing identical record names from different cases.

Record identity is kind + case + stable object index. Reopening a record selects its existing tab without reordering or resetting it. Each retained body remains mounted, hidden and inert while inactive, preserving its scroll position, expanded action, review checkbox and recorded-agent disclosure. There is no automatic eviction. The drawer X and Escape hide the drawer, preserving tabs, selection and width. Minimizing the portfolio project retains the workspace session too. Individual X/keyboard Delete removes only that record's retained view state; active clearing selects the nearest surviving tab, falling back to the correct case's Assistant.

Actions remain inside their task. Received evidence links can open a document directly, while requirements and documents retain their originating task/action context. Return links reopen, expand, scroll to and focus that action even if its parent tab was cleared or another task has since opened. Requirements, documents and tasks deduplicate independently. Clearing a task tab leaves its document and requirement tabs intact. Case-specific task/activity/review data and assistant conversations remain isolated across case navigation.

Re-reviewed original `PanelStackProvider.tsx`, `PanelTabNav.tsx`, `SidePanelHost.tsx`, `drawer-navigation.ts`, `RequirementDetail.tsx` and `ActionEvidence.tsx`. The source's stable identities, pinned Assistant and parent relationships are retained. Its six-record eviction, whole-dock clearing and body remounts intentionally give way to the user's explicit preserve-until-cleared requirement. This remains a fictional local interaction showcase; no original application, customer data or backend is exposed.

The case header's file badge is removed. All status pills use text and color without dot elements; the case-title punctuation remains.

Verification: nine reducer tests cover identity, context refresh, UI retention, no eviction, hide/show, active and inactive clearing, parent/child independence and isolated updates. Production build, TypeScript and focused ESLint passed. Browser checks confirmed checkbox/expanded-action/scroll retention through task → document → requirement → task and gallery close/reopen; cleared state resets on reopening that object; a document still returns to its original task after another task opens; seven objects stay retained; newly created tasks remain case-specific; and clearing the last object selects that case's Assistant. At 390px and 320px the selected tab's X stays inside the scrolling rail, with no dialog overflow. No browser console errors were observed. Proof: `outputs/case-retained-objects/desktop.png` and `phone.png`.

## Case alignment, actor identity and timestamps — current

Overview’s first icon, the search field border and the overview heading now share a content inset: 28px on desktop and 16px on phones. Only the first section tab aligns its contents to the left; the existing full-width rail remains. The grid’s fixed desktop miniature retains the desktop inset at every breakpoint.

Every AI specialist assignee/actor now uses a purple “AI” initials badge instead of a brain. Activity’s final column is Date & time, with a semantic ISO `dateTime`, a full date and 24-hour time in America/Toronto. The five fictional events are dated October 25, 2026; locally created tasks capture their actual creation timestamp. Human initials and names remain unchanged.

The AI insight heading has no spark. Its specialist-name control is replaced with one outline recommendation icon, with an accessible name and tooltip retaining the specialist attribution. The control still expands the recorded result; the other active workspace finding/result icons also use the recommendation outline.

Production build, TypeScript and focused ESLint passed. Browser measurements confirmed the Overview icon/search/overview-heading x positions match at both 1422px and 390px viewports. AI badges render text with purple ink and no SVG. Activity dates and times have valid ISO attributes, the date cell has no overflow at a 650px table width, and the last column remains available in the phone’s horizontally scrollable table. The recommendation control opens/closes the recorded result. No browser console errors were observed. Proof: `outputs/case-detail-polish/activity.png`, `insight.png` and `phone.png`.

## Desktop showcase and shared assistant tab — current

The portfolio grid now presents a static, code-rendered desktop miniature of the same case workspace shown when expanded, starting in Tasks. The bespoke animated Activity study card is removed. The preview is inert and uses a fixed 1280 × 850 desktop layout scaled to the grid column; it adds no product title, captions or activity carousel.

Assistant, Task, Requirement and Document share one flat contextual tab rail. Assistant is pinned first, and the panel close stays at the far right. This follows the source `PanelTabNav.tsx` and `SidePanelHost.tsx` relationship, retaining the focused four-tab UI rather than adding a multiple-record history browser. The rail uses 36px tabs, 16px icons, 12px labels and compact horizontal padding. At narrow drawer widths Assistant becomes an accessible icon tab while the record rail scrolls. Only opening the drawer animates it; switching context changes its body without replaying the drawer slide. Resize width persists across tab changes and close/reopen.

The chat no longer displays “Sample responses” or the redundant “Case context” panel title. Its mounted, inactive tabpanel is hidden and inert, preserving messages, draft and pending replies when following a record link or closing the dock. Selecting Assistant from the tab rail keeps tab focus; the top-right shortcut focuses the composer. The fictional-data identity and no-live-AI composer note remain. Requirement details display the originating task name consistently, including company financial statements reached from other tasks.

Verified against the production build at 1422 × 800, 390 × 800 and 320 × 800 CSS viewports. The grid preview uses the desktop workspace with no Activity study title or cycling content. Exactly one dock tabpanel is visible at a time. Chat → outstanding requirement disables Document; returning to Assistant retains the reply and draft. Arrow/Home navigation retains tab focus. Resize from 520px to 544px persists across record tabs and close/reopen. Evidence ordering → company statements → Document → Task returns to the originating evidence-ordering task. At 320px End selects and reveals Document while Assistant stays pinned, the close remains visible, and the dialog does not overflow. Escape closes the dock before the gallery. Production build, TypeScript and focused ESLint passed; no browser console errors were observed. Proof: `outputs/case-shared-tabs/grid.png`, `assistant.png` and `phone.png`.

## Assistant control — current

The Blender shuriken is retired from every active workspace and chat surface. The workspace brand returns to the neutral grid mark. The assistant uses a small outline chat bubble with exactly one spark, inside a silver gradient button at the top right. Only its open state gains a soft blue gradient glow and blue-tinted border. Chat avatars and the panel header repeat the quiet outline symbol, without image assets or continuous motion. The earlier Blender exports remain unused source artifacts.

Verified idle and active styles, 34px desktop / 32px phone sizing, a live blue glow only for `aria-expanded=true`, and zero image elements in the rendered workspace. At 390px the page has no overflow; Escape closes the panel and returns focus to the assistant button. Build, TypeScript and focused ESLint passed; browser errors were empty. Proof: `outputs/chat-bubble-assistant/desktop.png` and `mobile.png`.

## One table system

All cases and Assigned to me now use the same native table, bordered search field, flat tab rail, transparent header and row rhythm as the case's task table. Requirements, Documents and Activity use the same title button, type weight and cell padding. The people column is second in every table. Decorative icons and client initials were removed from first columns; assignee initials and AI brain avatars remain with their named actors. Outline icons share a 1.5px stroke, with neutral gray navigation and purple reserved for AI identities.

Production browser measurements match across all five table types: 40px headers, 74px data rows and 12px/500 first-column titles, with no first-column SVGs or images. All cases shows five records, Assigned to me shows the three owned by Natalie, and searching for Marcus finds Jordan's case. At 390px the queue retains all five columns in its horizontal scroll area without page overflow. Build, TypeScript and focused ESLint passed. Proof: `outputs/consistent-case-tables/cases.png`, `tasks.png`, `activity.png` and `mobile.png`.

## Previous machined assistant and contextual chat (retired visual)

The assistant shortcut is now 32px on desktop and 28px on phones, moved closer to the right edge. The animated shuriken also replaces the top-left workspace mark; phones show it beside the breadcrumb when the sidebar is hidden.

Both assistant and record docks have a draggable left-edge separator. Pointer capture keeps dragging stable; widths clamp between 320px and the available desktop space, capped at 900px. Arrow keys resize by 24px, Home/End select limits, Escape cancels a drag, and double-click restores the default. Phones keep a full-width panel and hide the separator. Cursor and selection styles are restored on release, cancellation and unmount.

Resize verification passed: actual pointer dragging changed 520px to 670px; keyboard limits reached 320px and 900px; Escape restored the pre-drag width without closing the panel. Record tabs fit at 320px. At 390px the custom width cleared, the panel filled the screen, the grip was hidden, and the page had no horizontal overflow. Build, TypeScript and focused ESLint passed; browser error logs were empty. Proof: `outputs/case-panel-resize/desktop.png` and `mobile.png`.

The top-right assistant control is now a transparent Blender-rendered, rounded four-point silver object. Opening the assistant starts a 32-frame 3D rocking loop with changing metallic reflections and slides in a dedicated chat dock. Reduced motion and the portfolio pause control keep the still image. The editable scene is `outputs/assistant-star/assistant-star.blend`; procedural geometry, material, lighting and render source are in `scripts/render-assistant-star.py`. No external model or texture was used.

The chat has suggested prompts, a free-text composer, scrollable conversation, sample-response attribution and links into the existing records. Personal-statement links open requirement 2; physician evidence opens requirement 4 with its medical task. No live model or backend is connected. Closing or pressing Escape returns focus to the top-right assistant control. The chat header replaces object tabs while chatting; linked records return to the normal Task / Requirement / Document dock.

Verified in the production browser: still/motion image switching, sample and free-text replies, evidence/task navigation, disabled Document for outstanding evidence, and Escape focus return. At 390px the page has no horizontal overflow and the 16px composer remains visible. Production build, TypeScript and targeted ESLint passed; browser errors were empty. Proof: `outputs/assistant-chat/desktop.png` and `mobile.png`.

## Case identity and header actions

The case header now pairs a small document badge with one title: case number · person name. Status remains underneath. The Underwriting segment tag is removed, and the assigned person's avatar stays aligned with the header controls. Decision opens the existing decision task and its related evidence; Call back opens the task composer with the current person, case reference and owner prefilled. Ordinary Create task still starts empty. These actions remain local to the fictional study.

The five case tabs share consistent outline icons, centered labels and circular count badges. Counts reflect local task and activity creation. The header wraps on smaller screens and the tab rail scrolls within its own width.

Verified in the portfolio dialog and standalone view: callback cancellation returns focus to its opener; ordinary creation starts empty; callback creation opens the new task and updates Tasks/Activity counts; Decision opens the correct blocked task and evidence. All count badges measure 20px circles on desktop with matching 16px icons. At 390px the page has no horizontal overflow, and keyboard navigation scrolls the selected tab into view. Production build, TypeScript and targeted ESLint passed; no browser errors were captured. Proof: `outputs/case-header/portfolio.png`, `desktop.png` and `mobile.png`.

## Flat record tabs and dynamic actions

The right panel uses one flat white tab row with a thin selected underline, simple Task / Requirement / Document labels and a separate close control. Record-name subtitles, individual pill borders and tab shadows are removed. Arrow, Home and End keyboard navigation remain available.

Actions now expand into task-specific instructions and linked requirements. Financial review includes the received company statements and outstanding personal statement, a local review acknowledgement, and a recorded state that belongs to the selected task. Recording the review leaves the task in review while evidence is missing. Other tasks no longer reuse the financial action/evidence; record labels and document return links follow their actual context. All interactions remain fictional and browser-local.

Verification passed in the production browser: the portfolio opens the focused study; record tabs have no radius, shadow or filled background; the action disclosure collapses its inaccessible content; recording a review updates its count/status and restores focus to the action header. Review state survives Task → Requirement → Document → Task navigation. Outstanding requirements disable Document. The medical task opens medical evidence instead of the financial statement. Galia retains a keyboard entry into record tabs. At 390px the tab row has no horizontal overflow and the expanded action fits the panel. No runtime errors were captured. Targeted ESLint, TypeScript and the production build passed.

Current proof: `outputs/case-workspace-refined/flat-tabs-and-actions.png`, `action-detail.png` and `mobile.png`. Older screenshots below describe earlier iterations.

## Case overview and table system

The case header no longer contains the owner, team, policy, priority and due-date row. Overview is a new first tab with six restrained metadata cards. Tasks remains the initial working tab. The case tab rail fills the available width with plain counts and one thin active underline.

Tasks, Requirements, Documents and Activity now use the same full-width native table treatment: transparent headers, fine separators, consistent row spacing and bordered search on the left. The former All tasks / Needs attention / AI assigned pills are removed. Search supports empty, filled, hover, focus and disabled styling; clear restores input focus. On phones the tables scroll horizontally and retain every column, while the tab rail fits the screen.

Named fictional people use circular initials avatars. Function-named AI specialists use a purple outline brain with a soft shadow. The same identity treatment appears in assignee, handled-by, added-by and activity actor cells. Create task opens a validated local form and appends a browser-local task and activity entry, then opens the task's action panel. No requirement or document is fabricated for the new task. Reopening a case resets the local scenario safely.

Production browser checks passed: all four search inputs filter the expected rows; empty creation shows a required-name error; valid creation updates task and activity counts; reopening a case after creation does not crash. AI assignment inspection still opens its recorded result. Escape closes only the nested create dialog and restores Create task focus. At 390px the tab rail has no overflow, all four table columns remain rendered, and keyboard horizontal scrolling works. Switching case tabs remounts the content panel so the new section starts at the top and left. No runtime errors were captured. Production build, TypeScript and targeted ESLint passed. Proof: `outputs/case-tables-overview/`.

## Neutral study identity and Overview hierarchy

The active portfolio tile, expanded dialog and standalone page now present “Contextual workflows” as an interaction study with fictional data. The company wordmark, inline pyramid and Case Management product title have been removed from this study. Agent graphics reuse the generic purple brain; the conversational control is simply Assistant. The separate profile employment information and historical pages were outside this pass.

The record header contains the reference, person name and status below that name. Its right side holds a small team segment tag and the assigned person's initials avatar, whose tooltip identifies the assignee and whose click opens Overview. Progress no longer occupies the header. Overview has two cards: one definition list for Owner, Policy, Priority, Due date and Type, followed by a five-step Progress card. The generic stages are Intake, Evidence gathering, Review, Decision and Completion.

Blur and passcode gating were deferred while refining the UI. This pass does not add access control or create another activity project. Existing contextual tabs and animated activity preview remain.

Verified in the production browser: the active dialog has no company/product-name text and carries the fictional-data study label; Overview contains exactly two cards and the first has the five requested fields; progress renders five steps only in Overview; status is below the name and the assignee remains at the right. The assignee opens Overview, the renamed assistant preserves keyboard entry into related-record tabs, and Requirement → Document navigation still returns to the right task. At 390px cards stack without page overflow. Build, TypeScript and targeted ESLint passed; no runtime errors were captured. Proof: `outputs/contextual-workflows/study.png`, `overview.png` and `mobile.png`.

Created October 25, 2026. A new portfolio exploration, separate from the existing captured application and its historical `/case-management` case study. Public concept page: `/case-workspace`. Portfolio entry: `case-workspace`.

## Source review

Read-only analysis of the correct checkout, `work/case-management-platform`, clean at `d58b51fa981664a533a8c9fe135a4254e952275f` (`jmramons-coder/case-management-platform`). Inspected original assistant and requirement panel captures, plus the following source:

- `src/app/components/shared/ActivityTable.tsx`: activity, actor, time, entity type and linked location. Existing case history is a table; task history is a thread.
- `src/app/lib/supabase/activity.ts`: event semantics, task/requirement location resolution and fallback when the requirement column is unavailable.
- `src/app/features/tasks/components/TaskActivityLog.tsx`: chronology, actor attribution, Activity / Comments filters and event-specific icons.
- `src/app/features/cases/hooks/useCaseActivity.ts`: query invalidation channel exists, but the activity table is not currently published for realtime delivery. The concept does not claim live cross-client synchronization.
- `src/app/lib/ai-workforce.ts`: function-named assignable workforce, including Document Intake, Application Review and Evidence Reconciliation. These are gated by `assistant_workforce`; roster descriptions are intent, not proof of actual model execution.
- `src/app/features/assistant/lib/agents.ts`: Galia is the conversational assistant, distinct from the function-named workforce. Its persisted internal id is historical.
- `src/app/features/panels/PanelStackProvider.tsx`: six recent within-session contexts, stable labels, explicit back history and transition suppression during record swaps.
- `src/app/features/panels/PanelTabNav.tsx`: task, requirement, note, document, decision and assistant record kinds; current shared panel tab row is behind `dynamic_side_panel`.
- `src/app/features/cases/components/RequirementDetail.tsx`: recorded findings and attribution, manual-note distinction, linked task actions and most recent received attachment.
- `src/app/features/documents/components/DocumentPanelBody.tsx`: selected document owns the panel body while navigation owns the shared close.
- `src/app/features/assistant/lib/model/snapshot-payload.ts`: bounded task/activity/requirement/document context, coverage and truncation markers.
- `src/app/features/assistant/lib/model/tools/read-tools.ts`: read-only assistant tools. Document tool explicitly states `contentsRead:false`; metadata is not document comprehension.
- `src/app/features/cases/components/CaseDecisionPanel.tsx`: outcome and reason required, decision does not falsely complete all remaining work.

Earlier verified analysis remains in `case-management-product-analysis.md`. No source application, database, scenario, feature flag, customer record or model endpoint was changed.

## Revised interaction model

The first activity-centric concept was rejected by the user because it removed the application’s case-management hierarchy. This implementation replaces that model rather than cosmetically revising it.

1. **Case queue.** Client/reference, request type, business stage, assignment, priority and due date. Search and Assigned to me filters work. Opening a row selects the case and retains it in the workspace sidebar.
2. **Case record.** Reference, client, insurance request type, caseworker, status and business stage remain above Tasks / Requirements / Documents / Activity. The five business stages and task names follow the source application. This is a case workspace, not a separate AI dashboard.
3. **Tasks and actions.** The task list shows assignments and completion/blocking states. Selecting a task opens the right panel and reveals its nested action in the list. Application Review and Requirement Ordering are assigned agents; financial review remains with the caseworker and carries Financial Screening’s recorded contribution.
4. **AI within work.** Selecting the AI attribution inside the task reveals the recorded result. Activity history also opens the associated task and agent result. No standalone agent hub or invented multi-agent graph is presented.
5. **Stable record dock.** Task / Requirement / Document navigation stays at the top right. Requirement content tracks the selected requirement, distinguishes received/ordered/outstanding evidence, and preserves the case behind the panel. Received documents link back to the requirement and task. Missing evidence has no fabricated received file.
6. **Financial review context.** Company financial statements are received, while the applicant’s personal statement is outstanding. Recording an evidence review does not complete the task or the case. Galia’s example response names that same blocker and links to the work.

Additional source reviewed for this correction: `CaseList.tsx`, `CaseDetail.tsx`, `CaseTaskTable.tsx`, `CaseStageStepper.tsx`, `CasesRailPanel.tsx`. In particular, CaseTaskTable distinguishes tasks from nested actions and stage grouping; CaseList preserves the insurance request, client, assignment and due context.

## Visual system and scope

New white/blue-gray desktop interface, borrowing aBeam’s restraint while keeping the original domain structure. Equisoft’s mark identifies the workspace and AI assignments. The first portfolio card cycles queue → case tasks → activity → task/agent result → requirement → document. It pauses when hidden, offscreen, globally paused or reduced motion is requested.

All records/documents/findings are fictional browser-local examples. The source app, database and model services remain unchanged. No extraction, live agent execution, underwriting decision or production outcome is claimed. On phones the right dock uses the full content area while retaining the case header and a close action returning to its list.

## Verification

The revised production build and targeted ESLint passed. Browser QA and screenshots are recorded under `outputs/case-workspace-concept/*-v2.png`. The earlier screenshots are retained as iteration history and do not represent the current design.

Revised runtime verification: case search yielded the one matching Avery record; opening it exposed the staged task list. Financial Screening expanded within the financial-review task. Task → Requirement → Document and keyboard ArrowRight preserved the case. Selecting Personal financial statement displayed its outstanding state and disabled Document rather than inventing evidence. Following Financial Screening from Activity restored the correct audited-statements requirement even after inspecting another requirement. At 390px, dialog content width was 390px and the case header remained visible. No browser runtime errors were captured. Production build, TypeScript, targeted ESLint and whitespace checks passed after the final corrections.

## Visual direction correction

The second full-dashboard presentation was also rejected as inconsistent with the portfolio. The current grid treatment is a dedicated, code-rendered 390px-wide activity close-up, rather than a 1200px application miniaturized inside a tile. It opens with one inline agent result visible and cycles only those inline disclosures. It has no sidebar, footer, bezel or persistent Explore label in the grid. The full application still opens for record interaction, starting in the same case’s Activity section.

Typography now uses the portfolio/aBeam `--font-geist-sans`, with aBeam's `#1e2936` ink, `#738092` secondary type, `#2787f5` accent and neutral white surfaces. Removed the prior pastel-blue text treatment, orange agent cards, fake modal app icon and exploration subtitle. The card and modal keep the portfolio’s shared corner radius and blur backdrop.

Production build, targeted ESLint, record navigation and 390px sizing passed after this correction. Browser confirms Geist and rgb(30,41,54) on the case title; no runtime errors. New proof: `grid-style-v3.png` beside the actual aBeam widget, and `expanded-style-v3.png`.

## Inside-case refinement — Tasks first

The expanded project and standalone page now both enter the selected case in Tasks. The header groups owner, team, policy reference, priority and due date in one metadata row. Business stage progress remains visible above the main case tabs. Left navigation, recent case and caseworker identity use consistent sizing and neutral materials.

Tasks now use a native accessible table (Task / Assigned to / Status / Due), with functional All tasks, Needs attention and AI assigned filters. Named AI assignee controls open their recorded work. Selecting a task reveals its nested action and opens a full-height right overlay from below the breadcrumb. The underlying table does not reflow or remove its assignee column. The task includes an always-visible attributed AI insight banner, action detail, properties and related requirement.

The object dock has pinned Task / Requirement / Document navigation with actual record-name subtitles, keyboard arrow navigation, content scroll reset and focus management. Escape closes the object dock before the containing gallery. Opening, object swaps, selected-tab indicators and action reveals animate and honor reduced/global motion preferences. Activity is now a native table with activity, actor, record and time rather than a sparse timeline.

Verified in the production browser: Tasks selected by default in both entry points; 3 AI-assigned tasks; 2 tasks needing attention; agent assignment opens the correct task; task/requirement/document keyboard navigation opens Signed application.pdf for the application task; Activity has a By column and links the financial event to Review financial data. Overlay top equals breadcrumb bottom, and native task-table width remains 1142.26px before/after opening. At 390px, dialog width is 390px and the object dock fits its 372px content area. No browser runtime errors. Build/TypeScript, targeted ESLint and diff whitespace checks passed.

Current screenshots: `tasks-v4.png`, `task-overlay-v4.png`, `activity-v4.png`, `mobile-v4.png`.
