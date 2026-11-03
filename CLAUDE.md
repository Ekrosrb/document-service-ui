# CLAUDE.md

## 1. Think Before Coding

State assumptions. Surface tradeoffs. Don't hide confusion.

- Make assumptions explicit; ask when uncertain.
- If a request has multiple valid interpretations, present them — don't pick silently.
- If a simpler approach exists, propose it. Push back when warranted.
- If something is unclear, stop and name what's confusing.

## 2. Calibrated Confidence

Distinguish verified knowledge from pattern-matched recall. Confident hallucination is the primary failure mode.

- Treat training-data recall as a hypothesis, not a fact — especially for API signatures, library behavior, config keys, and version-specific syntax.
- Use hedged language ("likely," "I believe," "verify this") when uncertain. Don't bury doubt in confident prose.
- Fabricated functions, invented options, and plausible-but-wrong syntax are common failure modes. If you can't point to a source, you don't know it — search (§8) or ask.
- A correct "I don't know" beats a confident wrong answer.
- Confidence must come from evidence (docs, the codebase, prior messages), not from fluency.

Test: Can you cite a doc, file, or prior message that justifies this claim? If not, flag it or verify before stating it.

## 3. Simplicity First

Minimum code that solves the stated problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No configurability or flexibility that wasn't requested.
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite.

Test: "Would a senior engineer call this overcomplicated?" If yes, simplify.

## 4. Surgical Changes

Touch only what's required. Clean up only what your changes broke.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor what isn't broken.
- Match existing style, even if you'd do it differently.
- If you spot unrelated dead code, mention it — don't delete it.

Orphan cleanup:
- Remove imports/variables/functions made unused **by your changes**.
- Leave pre-existing dead code alone unless explicitly asked.

Test: Every changed line traces directly to the user's request.

## 5. Goal-Driven Execution

Define verifiable success criteria. Loop until they pass.

Convert tasks to checkable goals:
- "Add validation" → write tests for invalid inputs, make them pass.
- "Fix the bug" → write a reproducing test, make it pass.
- "Refactor X" → tests pass before and after.

For multi-step work, state the plan upfront:

[Step] → verify: [check]
[Step] → verify: [check]
[Step] → verify: [check]

Strong criteria enable independent iteration; weak criteria ("make it work") force constant clarification.

## 6. Git Operations: PROHIBITED

**All git operations are forbidden — no exceptions.** This includes commits, branches, merges, rebases, tags, pushes, pulls, stashes, resets, cherry-picks, and config changes. Do not run `git` for any reason.

## 7. Project Context

Vue 3 single-page UI for browsing, editing and deleting the documents and memories of `mcp-document-service` over its REST API.

- **Stack:** Vue 3.5 (SFC, Composition API, `<script setup>`), Vite 8.2, Tailwind CSS 4.3 (`@tailwindcss/vite`, CSS variables, no config file), shadcn-vue 2.8 on Reka UI 2.11, axios 1.20, Vitest 5.0 + @vue/test-utils 2.5 + jsdom, markdown-it 15 + DOMPurify 3.4, highlight.js 11.12, lucide icons, Node ^22.18 || >=24.12
- **Type:** Browser SPA (no router, no store library)
- **Task scope:** `feature` — adding to an existing codebase
- **JavaScript only.** No TypeScript; `jsconfig.json` maps `@/*` to `src/*`.
- Backend base URL: `VITE_API_BASE_URL`, default `/api/v1`, proxied in dev to `http://localhost:55535` (`vite.config.js`).

### 7.1 Architecture

- `src/views/HomeView.vue` owns all view state: `'overview' | 'documents' | 'detail' | 'edit' | 'trash'`, the selected document, the editor target, the back target and the filters one screen asks another to apply. There is no router — screens are swapped by this state.
- Screens: `components/overview/OverviewScreen.vue`, `components/documents/DocumentsScreen.vue`, `components/document/DocumentDetail.vue`, `components/document/DocumentEditor.vue`, `components/trash/TrashScreen.vue`. Chrome in `components/layout/AppHeader.vue`.
- `src/api/` is the only place that talks HTTP: `http.js` (axios instance), `ApiError.js`, one module per resource (`documents.js`, `relations.js`, `projects.js`, `metrics.js`), `enums.js`, barrel `index.js`. Components import from `@/api`, never axios directly.
- `src/composables/`: `useWorkspace.js` is a module singleton holding project list, document/memory counts and trash count; `useTheme.js` the light/dark toggle.
- `src/lib/`: display and rendering helpers (`documentView.js`, `format.js`, `markdown.js`, `highlight.js`, `xml.js`, `toonLanguage.js`). `src/validation/`: form and search validation.
- Document content is rendered per `DocumentType`: plain text for TEXT/HLD/CUSTOM, highlight.js for JSON/CSS/TOON, rendered-with-raw-toggle for XML (tree), MARKDOWN (markdown-it + DOMPurify) and HTML (sandboxed iframe).
- Listing uses an empty search body for "everything", per-type counts come from `GET /metric/count/type`, and relations are requested only when superseded entries are included.

### 7.2 Conventions

- Tests: `npm run test:unit` (`-- --run` for one pass). Every module, composable, screen and primitive has a spec in a sibling `__tests__` folder plus a `*TestData.js` holding builders and constants — specs contain no literal fixtures. Shared component builders: `src/components/__tests__/componentTestData.js`.
- Query components through `data-test` attributes, not classes or text.
- Mock the API per spec with `vi.mock('@/api')`, spreading `vi.importActual('@/api/enums')` so enums stay real. Mock `@/composables/useWorkspace` in screen specs; re-import it after `vi.resetModules()` in composable specs.
- Reka UI dialogs portal one tick after mount: `await flushPromises()`, query `document` for `[data-slot="dialog-content"]`, unmount and clear `document.body` afterwards.
- Debounced inputs: `vi.useFakeTimers()` + `advanceTimersByTimeAsync(400)`.
- Compare variant classes against `cn(buttonVariants({ variant }))` — tailwind-merge drops base classes a variant overrides.
- No linter or formatter is configured. Match the style of the file you are in: 2-space indent, no semicolons in `.js`, single quotes.
- Comments only where the project already uses them — class/section and non-obvious behavior. Do not add narration.
- Theming is CSS variables in `src/assets/main.css`; dark is the default. Add colors as variables, never hard-coded hex in components.

### 7.3 File-Scope Boundaries

- `dist/`, `node_modules/` — generated. Never edit.
- `src/components/ui/**` — shadcn-vue generated primitives. Add new ones with the shadcn-vue CLI; hand-edit only when the task explicitly asks for it.
- `.vscode/`, `.claude/` — tooling config, out of scope unless named.

## 8. Web Research

**Search instead of relying on memory when the answer concerns:**
- Library/framework versions, API signatures, config options, or syntax
- Error messages, deprecations, or breaking changes
- Anything qualified as "current," "latest," "recommended," or "best practice"
- Third-party service behavior (auth flows, rate limits, response schemas)
- Package availability, maintainership, or fork status

**Source priority:**
1. Official docs for the exact version in use
2. Official release notes / changelog
3. Maintainer's repo (issues, discussions, README)
4. Reputable secondary sources — cross-check only

**Pre-code self-check:**
- Verified signature/option against docs for the target version?
- Still recommended, or superseded?
- Anything changed in the last 12 months I might have missed?

**Default stance:** Treat training-data recall as a hypothesis. If one search would confirm or refute it, search.
