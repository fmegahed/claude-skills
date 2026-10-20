| Item | Value |
|---|---|
| Status | Closed |
| Version | 1.0 (2026-10-20) |
| Written by | Claude Code |

This ledger is a copy of the working ledger for the plan `replication_materials/plans/2026-10-19-replication-skill-plan.md`. It was copied on 2026-10-20 at the end of the work. Internal agent IDs are removed.

# SDD ledger — plan: replication_materials/plans/2026-10-19-replication-skill-plan.md

Spec: replication_materials/plans/2026-10-19-replication-skill-design.md (version 3, D1 to D21).
Repository: C:/Users/megahefm/Dropbox/Miami/Code/claude/claude-skills (git init by the controller, branch main).
Partner decision (2026-10-19, multiple-choice question): build directly on main ("Build on main (Recommended)").

## Pre-flight scan

| Pair / task | Produces -> consumes | Finding |
|---|---|---|
| T1 -> T5 | `tests/contrast.mjs` contrast(hexA, hexB); `brand/miami.json` keys | T5 must map tokens to brand keys; the spec Section 9 table gives the map. See Ruling 5. |
| T1 -> T6/T7 | package.json scripts `test`, `test:a11y` | Script strings only; consumers come later. OK |
| T2 -> T3, T4 | parseTables, findTable, RecordFormatError, readMeta | Signatures identical in T3/T4 text. Error text `table "Decisions" lacks column(s) How.` matches the T4 and T6 regexes if T4 passes file names relative to replication_materials/ (`project/decisions.md`). Dispatch note for T4. OK |
| T3 -> T4 | readPeople, readDecisions, readRulings, applyCorrections | ⚠ CONFLICT: T3 says readDecisions applies the Corrections table before return, but corrections may name R- IDs that do not exist before rulings are read, and T3's own test "correction of an unknown decision throws" would then fire on valid R- corrections. See Ruling 3. |
| T4 -> T5, T6 | SiteModel (config, build, decisions, milestones, documents, calls, counts) | Field names agree with T5 pageShell and T6 tests (`2 of 3`, `jev`, `0.003`, decided-by IDs fmm/claude). OK |
| T4 fixture -> T6 tests | D2 text `Use <script>alert(1)</script> \| safely`; counts fmm 2, claude 3 | Agree after the plan fix of the D2 fixture line. OK |
| T5 -> T6 | rel, inline, escapeHtml, pageShell, CDN, themeCss | Names consistent. OK |
| T6 -> T7 | built site, data-filter-* markup, count text `Showing {n} of {m}.` | T7 keyboard test reads the same markup. OK |
| T6 -> T8 | build-site.mjs CLI `--root` | T8 copies scripts/ as .replication/. OK |
| T4 -> T8 | document rules (README.md and calls/README.md are documents) | ⚠ CONFLICT: T8 test expects `records/index.html` to contain `No documents yet.`, but the templates include README.md and calls/README.md, which T4 lists as documents. See Ruling 4. |
| T4 -> T8 | process time regex `YYYY-MM-DDTHH:MM(:SS)?Z` | ⚠ GAP: the T8 placeholder list has only `{{DATE}}`, so the set-up row of process.md cannot hold a valid time. See Ruling 6. |
| T8 -> T9 | template paths named in SKILL.md; scenario 2 needs a templated record | Order fixed in the plan (templates are Task 8). OK |
| T9 self | writing-skills scenarios need fresh subagents | ⚠ CONFLICT with the implementer contract ("You Do Not Dispatch Subagents"). See Ruling 7. |
| T6, T8 -> T10 | scripts copied to .replication/; templates; loadProject(".") | Byte-equality test of T10 holds only if T10 copies after T6/T7 fixes. T10 runs after T9. OK |
| T10 -> T12 | workflows, record | OK |
| T11 self | junctions with `cmd //c mklink //J` from Git Bash | OK |
| T12, T13 | public repository, Pages, push to main, force-push of the throwaway repository | Outward actions. See Ruling 8. |
| T13 step 5 -> final review | ledger copy before the final review | The committed copy would miss the final-review lines. See Ruling 9. |
| T1 self | Step 1 says `git init -b main` | The controller already ran it. See Ruling 1. |
| T2 self | 7 tests listed, "7 passing" | OK |
| T3 self | 9 tests listed, "9 passing" | OK after Ruling 3 (tests use applyCorrections directly). |
| T4 self | 10 tests listed, "10 passing"; fixture kinds order design, plan, probes, findings, ledger, readme, calls | OK ("README.md" sorts before "calls/README.md"). |
| T5 self | 8 tests listed, "8 passing" | OK |
| T6 self | 9 + 4 tests | OK |
| T7 self | step 2 allows PASS or FAIL (characterization) | OK |
| T8 self | 5 tests | OK after Rulings 4 and 6. |
| T10 self | D1 to D21; times from the transcript | OK |

## Rulings before execution

Ruling 1: The controller ran `git init -b main` before Task 1, because the workspace script needs a repository. Task 1 skips that step. — Cost if wrong: none.
Ruling 2: Models. Implementers: sonnet for Tasks 1-8 and 10-13; opus for Task 9 (skill text, writing judgment). Task reviewers: sonnet; opus for Tasks 6 and 9. Final review: opus. — Cost if wrong: a fix round on a weak task.
Ruling 3: `readDecisions` returns decisions with `corrected: null` and does not apply corrections. Task 3 adds `readCorrectionsTable(text: string, file: string): Table | null` (null when the file has no `## Corrections` table). `loadProject` (Task 4) applies `applyCorrections` once, on the full list after the rulings, so a correction of an R- ID works. The idempotency sentence of Task 3 is dropped. — Why: readDecisions cannot resolve R- IDs before the rulings exist. — Cost if wrong: a small move of one call.
Ruling 4: Task 8 test `templates build to a site`: replace the assertion "`records/index.html` contains `No documents yet.`" with "`records/index.html` links to `docs/README/index.html` and `docs/calls/README/index.html`". — Why: under Task 4 rules both template READMEs are documents, so the page is never empty; the empty state stays tested in Task 6. — Cost if wrong: none.
Ruling 5: Token to brand-key map for the Task 5 test: bg=warm_white, surface=white, tan=light_tan, ink=black, muted=medium_gray, rule=medium_tan, accent=miami_red, accent-strong=accent_red, on-accent=white (spec Section 9 table). — Cost if wrong: none.
Ruling 6: Task 8 adds the placeholder `{{TIME_UTC}}` (`YYYY-MM-DDTHH:MMZ`) for the set-up row of `process.md`. — Why: Task 4 rejects a time without the time part. — Cost if wrong: one extra placeholder.
Ruling 7: The writing-skills scenario runs of Task 9 are dispatched by the controller, not by the implementer. Baseline runs (no skill) happen before the implementer starts and go to it as a file; with-skill runs happen after its first report; failures go back to it as REFACTOR findings before the task review. Scenario subagents work only in scratch folders and make no network or GitHub call. — Why: the implementer contract forbids subagents, and nested dispatch may not exist. — Cost if wrong: more controller context.
Ruling 8: The outward actions of Tasks 12-13 are authorized by the approved plan: create the public repository `fmegahed/claude-skills`, turn on Pages, push `main`, and force-push the throwaway `fmegahed/replication-site-spike`. The dispatches name exactly these actions and no other. — Cost if wrong: a public repository that the partner must delete.
Ruling 9: Task 13 step 5 copies the ledger; the controller copies it again after the final review, just before it deletes this workspace, so the committed ledger is complete. The ledger holds no internal agent identifiers. — Cost if wrong: one more record commit.

## Execution
Task 1: dispatched (BASE 4b825dc empty tree, model sonnet)
Task 1: implementer DONE_WITH_CONCERNS (commit 7e2a9c0; 2/2 passing). Concern: Dark Tan and Corn Yellow hex read from the brand image; they equal the spec palette. Resolved.
Task 1: review: spec ✅, quality Approved. ⚠ items resolved by the controller: trailers present; package-lock pins @playwright/test 1.63.0 and @axe-core/playwright 4.13.0; npm test 2/2.
Task 1: minor (deferred): brand.test.mjs gives a TypeError, not an assertion, when a pairing names an unknown colour key.
Task 1: minor (deferred): brand.test.mjs does not check the hex format of all 11 colours (only 4 spot checks).
Task 1: minor (deferred): contrast.mjs uses the 0.03928 threshold, not 0.04045 (no effect for 8-bit values).
Task 1: minor (deferred): the implementer report has no raw test output.
Task 1: complete (commits root..7e2a9c0, review clean)
Task 2: dispatched (BASE 7e2a9c0, model sonnet)
Task 2: implementer DONE (commit 76470fc; 9/9 passing)
Task 2: review: spec ✅, quality Approved. ⚠ trailers checked by the controller: present.
Task 2: minor (deferred): heading regex strips a trailing # without a space (`## C#` gives `C`).
Task 2: minor (deferred): readMeta takes the title with /^# /m and ignores code fences.
Task 2: minor (deferred): no tests for alignment-colon separators, end of file without newline, too many cells, null-heading findTable, missing table with null heading; fence test does not check the heading after a fence.
Task 2: minor (deferred): duplicate column names overwrite each other; separator cell count is not checked.
Task 2: minor (deferred): a closing fence with trailing text closes the fence (CommonMark says no).
Task 2: Ruling: readMeta (minor 3) is load-bearing for Task 4. Task 4 changes readMeta to `readMeta(text: string, file: string)` and makes it lenient: it finds the first Item/Value table and never throws for another malformed table in a document. — Why: Task 4 calls readMeta on every prose document, and one sloppy table must not stop the site build (anti-goal A2). Record tables (decisions, roadmap, process) stay strict. — Cost if wrong: a document with a broken table builds without an error.
Task 2: complete (commits 7e2a9c0..76470fc, review clean)
Task 3: dispatched (BASE 76470fc, model sonnet)
Task 3: implementer DONE (commit e34d810; 20/20 passing; 11 decision tests). fenceFlags(lines) exported from tables.mjs and reused.
Task 3: review: spec ✅, quality Approved. ⚠ resolved by the controller: npm test 20/20; trailers present.
Task 3: minor (deferred): empty ruling text (`Ruling: ` with only spaces or backticks) gives an empty ruling and shifts the numbering.
Task 3: minor (deferred): stripping backticks at both ends breaks a ruling that ends in inline code (plan-mandated).
Task 3: minor (deferred): `Checked by` with several IDs silently uses the first.
Task 3: minor (deferred): two corrections of one decision keep only the last checker and date in `corrected`.
Task 3: minor (deferred): an empty `New value` for Decision or Evidence is accepted.
Task 3: minor (deferred): a People row with ID claude, subagent or unknown overrides the built-in name (attribution risk, A3).
Task 3: minor (deferred): no tests for an empty Proposed-by cell, spaces around IDs, CRLF ledgers, two corrections of one field.
Task 3: complete (commits 76470fc..e34d810, review clean)
Task 4: dispatched (BASE e34d810, model sonnet)
Task 4: implementer DONE (commit 445130b; 36/36 passing; project.mjs 266 lines). parseTables gained an optional { lenient } used only by readMeta(text, file).
Task 4: review: spec ✅, quality Approved. ⚠ items: R- ID format is covered by Task 3 tests (checked); kinds follow the brief.
Task 4: minor (deferred): a UTF-8 BOM at the start of a CSV or .md breaks the first column name and the title match. Strip a leading BOM when reading records.
Task 4: minor (deferred): an empty or non-numeric cost_usd stops the build; the CSV error line is the record index + 2.
Task 4: Ruling: (for the final fix wave) an EMPTY cost_usd counts as 0 (a failed call can have no cost); a non-numeric value still stops the build. — Why: jev4imageqc will log failed calls; one empty cell must not stop the site (anti-goal A2). — Cost if wrong: a missing cost shows as 0.
Task 4: minor (deferred): site.config.json with JSON null gives a TypeError; project and repository are not validated.
Task 4: minor (deferred): test gaps — no calls/ folder, CSV missing a column, whole-project CRLF, unknown kind suffix, ledger outside plans/ (its rulings are not read), Corrections absent, ruling-order ties.
Task 4: minor (deferred): calls/README.md without a table throws "table not found".
Task 4: minor (deferred): bad-column fixture duplicates the whole full tree (drift risk).
Task 4: minor (deferred): document sort comparator dense (project.mjs:222); probe date uses parts[1] only.
Task 4: complete (commits e34d810..445130b, review clean)
Task 5: dispatched (BASE 445130b, model sonnet)
Task 5: implementer DONE (commit 4609695; 45/45 passing; html.mjs 164 lines)
Task 5: review: spec ✅ except one Important; quality Needs fixes. Important: buttons use --rule (Medium Tan) as their only boundary (html.mjs:113).
Task 5: minor (deferred): inline() runs the code replacement before the link replacement; a backtick in a URL gives malformed href.
Task 5: minor (deferred): config.theme values and config.repository are not validated (raw into <style>; javascript: repository possible).
Task 5: minor (deferred): pre and .table-wrap need tabindex and a label (Task 6 adds them to .table-wrap per its brief).
Task 5: minor (deferred): rel() depends on process.cwd() implicitly.
Task 5: minor (deferred): no tests for head/scripts placement, the Repository nav link, inline() URL with " or &.
Task 5: fix round 1 dispatched (resume implementer, FIX_BASE 4609695)
Task 5: fix round 1/5 (1 addressed, 0 open; commits 4609695..33b3abe). Buttons: --tan fill, 2px --ink border; pressed: --accent-strong fill, --on-accent text.
Task 5: minor (deferred): pressed button fill equals the --accent focus-ring colour; check the offset keeps the ring visible (Task 7 focus test covers).
Task 5: complete (commits 445130b..33b3abe, review clean)
Task 6: dispatched (BASE 33b3abe, model sonnet; reviewer opus)
Task 6: implementer DONE (commit 0177caf; 61/61 passing). Extras: "All" button per filter group; one h1 per document page; out folder emptied instead of removed (Windows EBUSY).
Task 6: review (opus): spec ❌, quality Needs fixes. Important: (1) `--out ""` skips the out-folder check and overwrites files in the working directory (verified); (2) `..` links above replication_materials/ are clamped and break; (3) the JSON-escape test asserts nothing (fixture has no `<`); (4) no contents rail (spec Section 9 Appearance; plan gap); (5) markdown tables on document pages have no scope="col" and all regions are labelled "Table".
Task 6: ⚠ "templates Records test" clash — already settled by Ruling 4 (it is Task 8, not Task 10). Kinds readme/calls/probes come from the plan's Task 4 rules.
Task 6: Ruling: contents rail (finding 4) — document pages get a rail: client.js builds `<nav aria-label="Contents">` from the rendered h2 headings (adds ids when missing); at min-width 900px the document page is two columns with the rail sticky below the sticky header; below 900px the list sits above the content; without JavaScript there is no rail; record pages (Home, Records, Decisions, Progress, Process) get no rail. — Why: the spec asks for "a contents rail on wide screens" and EXPERTA had it on document pages; no task covered it. — Cost if wrong: a small layout feature to remove.
Task 6: minor (deferred): previous-site check matches the full version string; after a skill update a local _site is refused as "not a previous site".
Task 6: minor (deferred): emptying a previous-site folder deletes dotfiles (.git, CNAME, .nojekyll).
Task 6: minor (deferred): main guard fails when build-site.mjs runs through a directory junction (exits 0, writes nothing).
Task 6: minor (deferred): page <title> can repeat for documents with the same title.
Task 6: minor (deferred): ledger ruling sources are not linked to the ledger page.
Task 6: minor (deferred): h1 demotion uses innerHTML round trip.
Task 6: minor (deferred): relative image paths (![](figures/x.png)) and root-absolute markdown links are not rewritten.
Task 6: minor (deferred): links in tables and the Home pages list have no 24x24 minimum.
Task 6: minor (deferred): marked runs before KaTeX, so \, \{, \_ and * inside math can be changed (plan-mandated order).
Task 6: minor (deferred): config.repository not checked for https? before use in two new sinks.
Task 6: minor (deferred): build tests leave rm-build-* temp folders; no test for an index.html without the generator meta.
Task 6: fix round 1 dispatched (resume implementer, FIX_BASE 0177caf)
Task 6: fix round 1/5 (5 addressed, 1 new open — two-column grid applies without a rail, leaving an empty 15rem column; commits 0177caf..d8e4545). New lib/linkpath.js (resolveLink, inlined before client.js).
Task 6: minor (deferred): sticky rail taller than the viewport cannot scroll (add max-height + overflow-y auto).
Task 6: minor (deferred): a folder name with # or ? would be parsed as fragment/query by new URL in resolveLink.
Task 6: minor (deferred): no tests cover the contents rail (Task 7 browser tests will exercise it with h2 headings in the fixture).
Task 6: fix round 2 dispatched (resume implementer, FIX_BASE d8e4545)
Task 6: fix round 2/5 (1 addressed, 0 open; commits d8e4545..e98cb0e). Grid scoped to .doc-layout.has-rail; client adds has-rail.
Task 6: minor (deferred): no browser check that a document without a rail is single-column (Task 7 covers with a fixture document without h2).
Task 6: complete (commits 33b3abe..e98cb0e, review clean after 2 fix rounds)
Task 7: dispatched (BASE e98cb0e, model sonnet)
Task 7: implementer DONE (commit 3bf05cd; test:a11y 39 passed; npm test 72). No page changes were needed: zero axe violations at first run. Fixture design doc got ## Method and ## Results.
Task 7: review: spec ✅, quality Approved. Reviewer experiment: an injected <img> without alt in a copy of the built site made the axe test fail at a11y.spec.mjs:69 (image-alt). Tests bite.
Task 7: minor (deferred): focus test can pass with zero checked elements (no count assertion); checks outlineStyle only, not width.
Task 7: minor (deferred): sticky-header cover checked at the centre point only.
Task 7: minor (deferred): doc-page wait swallows all errors; with a blocked CDN the rail tests fail without a hint.
Task 7: minor (deferred): serve.mjs serves /repo/records (no slash) as index.html instead of redirecting like GitHub Pages.
Task 7: minor (deferred): plan-page rail test throws a TypeError if .doc-layout is missing.
Task 7: complete (commits e98cb0e..3bf05cd, review clean)
Ruling 10: Task 8 adds the placeholder `{{SESSION}}` (the session ID) for the Source column of the set-up decision D1 and the Session column of the set-up process row. — Why: spec Section 10 says Source and Session hold the session ID, and the brief's placeholder list has none. — Cost if wrong: one extra placeholder.
Task 8: dispatched (BASE 3bf05cd, model sonnet)
Task 8: implementer DONE (commit cd5bfe4; 6 template tests; npm test 78/78). Rulings 4, 6, 10 applied.
Task 8: review: spec ✅, quality Approved. ⚠ deploy job is named `pages` (as in the spike workflow); fine.
Task 8: minor (deferred): CLAUDE-block test is thin (does not check "no code" or the budget rule).
Task 8: minor (deferred): ledger-header.md and probe-README.md are not exercised by a fill test.
Task 8: minor (deferred): permissions regex in templates.test.mjs can span jobs.
Task 8: Ruling: angle-bracket fill-in text in the record README and probe-README vanishes on the site (marked parses it as a tag, DOMPurify strips it). Task 9 replaces each angle-bracket fill-in in the templates with a visible square-bracket marker `[...]`, and SKILL.md set-up requires Claude Code to write the README lead paragraph. — Why: a forgotten fill-in must show, not vanish silently (anti-goal A2). — Cost if wrong: none.
Task 8: complete (commits 3bf05cd..cd5bfe4, review clean)
Task 9: baseline scenarios built in the session scratchpad (outside the repository): s1-setup (git, no remote), s2-decision, s3-milestone (SDD ledger in .superpowers/sdd), s4-paid-calls.
Task 9: baseline (RED) done — s1 FAIL (invented replication/ folder, no stop for remote); s2 PASS; s3 FAIL (record no longer builds: How "subagent ruling"; stage milestone-close; ruling copied into decisions.md; ledger rewritten, task-complete lines lost; next milestone not set to now; no build check); s4 PASS. File: task-9-baseline.md.
Task 9: dispatched (BASE cd5bfe4, model opus)
Task 9: implementer DONE_WITH_CONCERNS (commit 189d07a; 78/78). SKILL.md ~1,700 words (five procedures in the body). Template markers now [...]; D1 Evidence is a quote marker.
Task 9: GREEN (with skill) — s1 PASS (stopped, no file), s2 PASS, s3 PASS (builds; 2 of 2; ruling from ledger; M2 now), s4 PASS. File: task-9-green.md. No REFACTOR round needed.
Task 9: minor (deferred): s4 agent asked the person for their ID although roadmap People holds it.
Task 9: review (opus): spec ✅, quality Needs fixes. Important: (1) the [...] marker grep matches plan checkboxes (93 lines in this repository's plan); (2) push on a feature branch is ambiguous — "commit and push the record" could push a code-bearing branch without asking.
Task 9: ⚠ resolved by the controller: POST /pages before the first push works (the spike created an empty repository, enabled Pages, then pushed); s2 scenario context stated Claude proposed both options, so Proposed by claude is correct.
Task 9: minor (deferred): Evidence rule differs between SKILL.md:98 (quote only) and record-formats.md (record-line name allowed for review/measurement/plan-approval).
Task 9: minor (deferred): no rule for subagent-proposed decisions (suggest Proposed by subagent, Decided by claude, How review; in an SDD run the ledger holds it).
Task 9: minor (deferred): ledger copy name gives <name>.md-ledger.md for a plan without -plan suffix.
Task 9: minor (deferred): record-formats.md says "a plan stays -plan.md"; should say "gets".
Task 9: minor (deferred): commands need Bash; nothing says to use Git Bash on Windows.
Task 9: minor (deferred): update step 1 compares versions without saying what to do; step 3 restores a deleted workflow.
Task 9: minor (deferred): set-up — re-run step 6 after the repository becomes public; no instruction for a failed first run or no-website case; default branch other than main never fires the workflow.
Task 9: minor (deferred): template D1 Proposed by `claude` is wrong when the person asked; a marker would be safer.
Task 9: minor (deferred): "Put their ID in Approved by" should say "from ## People".
Task 9: minor (deferred): SKILL.md:40 says all error files are relative to replication_materials/ (config/--out errors are not).
Task 9: minor (deferred): temp build folders never removed; gh run list --limit 1 right after a push can pick the previous run.
Task 9: minor (deferred): description trigger "updating the skill files" may be broad (plan-mandated).
Task 9: minor (deferred): writing — one 21-word sentence (SKILL.md:80); "Commit ... and push" double instructions; passive voice in site.md:88, writing.md:21-22; "record" means folder and file; site/website mixed.
Task 9: fix round 1 dispatched (resume implementer, FIX_BASE 189d07a)
Task 9: fix round 1/5 (2 addressed, 0 open; commits 189d07a..5c1f76d). Marker check limited to README.md and project/decisions.md; record push rule stated once (During the work step 7); branch pushes need asking.
Task 9: minor (deferred): narrowed marker check would miss markers if set-up later fills other files.
Task 9: complete (commits cd5bfe4..5c1f76d, review clean after 1 fix round; controller npm test 78/78)
Ruling 11: Task 10 writes this repository's record by hand, before the remote exists; the skill's remote check and Pages step are satisfied by Task 12, which creates the remote and turns on Pages before the first push. — Why: the plan orders publication last. — Cost if wrong: none.
Task 10: dispatched (BASE 5c1f76d, model sonnet)
Task 10: implementer DONE (commit c3cd19e; 80/80). Process times from the transcript and the spike commits (7e7b56d 01:34Z, de4b394 01:35Z).
Task 10: review: spec ✅ (D1-D21 match spec Section 7 row by row; checked times match), quality Approved. ⚠ resolved by the controller: marker check prints nothing (exit 1); npm run test:a11y 39 passed on the current tree.
Task 10: minor (deferred): repo-record equality test is one-way (a new file in scripts/ without a copy in .replication/ passes).
Task 10: minor (deferred): site-spike README "about one minute" — the session measured the deploy run (about 1 min); wording could say "within the run time".
Task 10: minor (deferred): the 02:20Z "Approved, go with subagent-driven" message has no process row.
Task 10: complete (commits 5c1f76d..c3cd19e, review clean)
Task 11: dispatched (BASE c3cd19e, model sonnet)
Task 11: implementer DONE (commit f7bcfaf; 80/80). Controller verified: 15 checksums identical; both <JUNCTION>s point into the repository; 13 video files tracked, 2 .webp local and ignored; Claude Code lists the replication-materials skill.
Task 11: review: spec ✅, quality Approved.
Task 11: minor (deferred): README paths for the video assets are relative to the skill folder, not the root; assets/brand/ does not exist after a clone.
Task 11: minor (deferred): README install commands — explain <repo>; mkdir -p ~/.claude/skills before ln -s; the Windows target folder must exist.
Task 11: minor (deferred): README says the skill "checks the records before any paid API call" — only in a project with replication_materials/.
Task 11: minor (deferred): "licence" (British) vs "license".
Task 11: complete (commits c3cd19e..f7bcfaf, review clean)
Task 11: note for the partner: the repository has no LICENSE file; publishing without one means all rights reserved (decision for the partner, not blocking).
Task 12: dispatched (BASE f7bcfaf, model sonnet). Authorized outward actions (Ruling 8): create public fmegahed/claude-skills, POST Pages build_type=workflow, add origin, push main, push the record row.
Task 12: implementer DONE. Repository https://github.com/fmegahed/claude-skills (public); Pages build_type workflow; pushed f7bcfaf; record row commit 4cb3c5b pushed. Runs: Tests 39366063047 success (f7bcfaf); Tests 39366176361 success and Replication site 39366176367 success (4cb3c5b). Live: https://fmegahed.github.io/claude-skills/ (home, decisions with D21, design doc: 200).
Task 12: finding (controller): the first push (15 commits, 102 files) did not start the path-filtered Replication site workflow; only Tests ran. The spike's first push (1 commit) did start it. A new project's set-up can therefore wait for a run that never starts.
Ruling 12: before the Task 13 acceptance test, SKILL.md set-up gets one step: after the first push, if no Replication site run starts within 60 seconds (`gh run list --workflow replication-site.yml`), start it with `gh workflow run replication-site.yml --ref main` (the template has workflow_dispatch). Task 13's implementer makes this change and the acceptance run validates it. — Why: acceptance criterion 2 (empty folder to live site) depends on it. — Cost if wrong: one extra command in set-up.
Task 12: review: spec ✅, quality Approved (live checks: public, exact description, Pages build_type workflow, home/decisions(D21)/design doc 200; record-only commit; no unauthorized action).
Task 12: complete (commits f7bcfaf..4cb3c5b, review clean)
Ruling 13: Task 13 runs in three parts. (a) Implementer: Ruling 12 change to SKILL.md set-up, plus the scratch project `setup-test/` (git init, README); commit and push main. (b) Controller (as in Ruling 7): acceptance subagents with the installed skill — A: set-up with no remote (must stop, no file); controller then adds origin = replication-site-spike; B: set-up with the remote, then (follow-up message) one new decision D2 pushed, site updated. Authorized for B on fmegahed/replication-site-spike only: push (force allowed if the first push is rejected), Pages GET/POST/PUT, gh run list/watch, gh workflow run. (c) Implementer: end-of-milestone procedure for M1 in this repository. — Why: the implementer may not dispatch subagents; acceptance needs fresh agents that only have the skill. — Cost if wrong: more controller context.
Task 13a: dispatched (BASE 4cb3c5b, model sonnet)
Task 13a: implementer DONE (commit ee3ac19 pushed; npm test 81; a11y 39; Tests run 39366491833 success). setup-test prepared (147c2b3, no remote).
Task 13b: acceptance A PASS (no remote: stopped, created no file; verified git status empty). Controller added origin = fmegahed/replication-site-spike in setup-test.
Task 13a: review: Approved (no Important). Minor (deferred): the run check is not tied to the pushed commit (`--commit "$(git rev-parse HEAD)"`); no explicit wait command; site.md places the bullets after the watch block; test regex hard-codes a 2-space indent.
Task 13a: complete (commits 4cb3c5b..ee3ac19, review clean)
Task 13b: acceptance B dispatched (set-up with remote = replication-site-spike)
Task 13b: acceptance B PASS — set-up from empty folder to live site https://fmegahed.github.io/replication-site-spike/ (title setup-test, D1); Pages 409 handled; force-push as allowed; push started no run, the Ruling 12 step started run 39366818472 (workflow_dispatch, success).
Task 13b: living-document check PASS — new decision D2 pushed (d758e53); the push started run 39366922525 by itself (success); the live Decisions page shows D2. The agent recorded Proposed by `unknown` because it saw no proposal in its session (correct under A3).
Ruling 14: at the close of M1, M2 stays `planned` and no milestone is set to `now`, because the partner's next work (JEV image research, jev4imageqc) happens in another repository. — Why: the roadmap must be true; "set the next milestone to now" assumes work continues here. — Cost if wrong: one roadmap cell.
Task 13c: dispatched (BASE ee3ac19, model sonnet)
