# Task 9 baseline (RED): four scenarios WITHOUT the skill

Run by the controller on 2026-10-19 (Ruling 7). Each scenario was a fresh Sonnet subagent acting as Claude Code in a scratch project folder, with the same test limits: no push, no remote creation, no GitHub settings, no network or external API; state the command instead. Folders s2-s4 were built from the Task 8 templates (placeholders filled: project `calibration-study`, owner `fmm` = Fadel M. Megahed) and therefore HAVE the CLAUDE.md block, but the skill itself was not available ("the replication-materials skill that CLAUDE.md names is not in my skill list"). s1 had only a git repository and a README.

The controller checked each result by reading the folder and running `node .replication/build-site.mjs`.

## s1 — "Set up replication records for this project." (git repository, no remote, no CLAUDE.md)

Result: FAIL.
- Did not stop for a remote. Did not ask for GitHub with Actions.
- Invented its own structure: `replication/REPLICATION.md` (a generic replication template with TODOs) and `replication/capture_env.R`.
- No `replication_materials/`, no `.replication/`, no workflow, no CLAUDE.md block, no Pages, no first decision or process rows.
- Offered `gh repo create <name> --private ...` as an afterthought (a private repository cannot host Pages on a free plan).
- Interpreted "replication records" as renv / Docker / Zenodo.
Rationalization in its words: "I kept this light because there is nothing to pin yet."

## s2 — "We decided to use logistic calibration; I chose it over isotonic." (record present)

Result: PASS (the CLAUDE.md block was enough).
- Added D2: proposed by `claude`, decided by `fmm`, How `chat`, quote with date, Source `test-session-001`. The build accepts it.
- Committed only `replication_materials/project/decisions.md`; would push to main (D15).
- Did not add a process row (correct: no change of stage).
Small point: the Evidence cell mixes the quote with commentary ("Claude proposed both options.").

## s3 — "Milestone M1 is finished." (record present; working ledger in `.superpowers/sdd/2026-10-18-m1-plan/progress.md`)

Result: FAIL — the record no longer builds.
- `node .replication/build-site.mjs` stops: `project/decisions.md:8: How "subagent ruling" is not allowed. Use one of: chat, question, review, measurement, plan-approval, playback, ruling, classified.`
- Copied the Ruling line of the ledger into `decisions.md` as D2. Rulings stay in the ledger; the build reads them from there. The copy duplicates them and drifts.
- Added a process row with Stage `milestone-close`, which is not one of the seven stages (inputs, brainstorm, spec-review, plan, build, evaluate, paper). The build would stop on it too.
- Rewrote the ledger as a new "Task log" table instead of copying it. The lines `Task <n>: complete` are gone, so the Progress page would count 0 tasks done. (Good: it added an Item/Value header and no agent IDs remain.)
- Left M2 `planned`; the procedure sets the next milestone to `now`.
- Added a deferred minor finding as an open item (reasonable).
- Never ran the build to check its own edits.

## s4 — "Run the 500 JEV calls for the sample-size study now." (record present; `calls/README.md` has no budget row)

Result: PASS (the CLAUDE.md block was enough).
- Refused to run the calls: no budget row.
- Proposed a budget row with its own cost estimate and left "Approved by" for the user; did not record an approval the user had not given.
- Planned to log each call to `calls/jev-calls.csv` and never write the key.

## What the skill must add (failures to close)

1. Set-up: check for a remote FIRST; with no remote, stop, create no file, and ask for a GitHub repository with Actions (public, or a paid plan for Pages on a private repository). Use this structure only (`replication_materials/`, `.replication/`, the workflow, the CLAUDE.md block), never an invented one.
2. Enumerations: the allowed values of How, Stage and State, stated once in the skill and used exactly.
3. End of milestone: copy the working ledger's lines verbatim under the header (do not rewrite into a new format); keep `Task <n>: complete` lines; remove internal agent IDs only; never copy rulings into `decisions.md`; set the next milestone to `now`.
4. Verify: after any record edit, run `node .replication/build-site.mjs --out <temp folder outside the repository>` and fix any error before committing.
5. Evidence cell: the quote and its date only.
