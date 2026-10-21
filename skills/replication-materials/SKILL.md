---
name: replication-materials
description: Use when starting a research project or setting up replication materials or replication records. Also use when recording a decision, closing a milestone, correcting a record, or updating the skill files. In a project with a replication_materials/ folder, also use it before any paid API call.
---

# Replication materials

## Overview

This skill keeps a replication record of a project. The record shows how the code came to be, who decided what, and where the work is. A GitHub Actions workflow builds a website from the record at each push.

The structure is fixed: `replication_materials/`, `.replication/`, `.github/workflows/replication-site.yml` and the `CLAUDE.md` block. Never invent another folder, file format or value. Here, "replication records" means this record, not renv, Docker or Zenodo.

`<skill>` is the folder of this file. Read a reference when a step names it:

- `references/record-formats.md`: each table, column, value and placeholder of the record.
- `references/site.md`: the website, the build, the workflow, Pages and the update rules.
- `references/writing.md`: the 80% ASD-STE100 rule for all text in the record.

## Allowed values

Use these values exactly. The build stops on any other value, for example `milestone-close` or `subagent ruling`.

| Column | File | Values |
|---|---|---|
| How | `project/decisions.md` | `chat`, `question`, `review`, `measurement`, `plan-approval`, `playback`, `ruling`, `classified` |
| Stage | `project/process.md` | `inputs`, `brainstorm`, `spec-review`, `plan`, `build`, `evaluate`, `paper` |
| State | `project/roadmap.md` | `done`, `now`, `next`, `planned`, `blocked` |
| Proposed by, Decided by, Checked by | `project/decisions.md` | an ID from `## People` in `roadmap.md`, or `claude`, `subagent`, `unknown` |

## Build check

After each edit of a record, run this from the root folder of the repository:

```bash
node .replication/build-site.mjs --out "$(mktemp -d)"
```

- Success prints `Wrote <n> pages to ...`. With extra pages, it prints `Wrote <n> pages and <k> extra pages to ...`.
- An error prints `replication-materials: <file>:<line>: <detail>`. The file is relative to `replication_materials/`.
- Fix that line and run the check again. Do not commit while the check fails.

## Session ID

The `Source` and `Session` columns hold the session ID.

- In a local session, it is the name of the newest transcript: `basename "$(ls -t ~/.claude/projects/<slug>/*.jsonl | head -1)" .jsonl`.
- `<slug>` is the project path with each character that is not a letter or a digit changed to `-`.
- In a cloud session, it is the session URL.
- If you cannot find the session ID, write `unknown`.

## Set-up

1. Run `git rev-parse --show-toplevel`. If it fails, ask the person before you run `git init -b main`.
2. Run `git remote -v`. If it shows no remote, stop. Create no file and no folder.
   - Ask the person to make a GitHub repository with Actions and to add it as the remote.
   - Tell them that Pages needs a public repository, or a paid plan for a private repository.
   - Continue only when `git remote -v` shows the remote.
3. If the remote is not on `github.com`, stop. Tell the person that version 1 supports GitHub only.
   - Read the default branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.
   - A new empty remote has no default branch. Then read the local branch: `git branch --show-current`.
   - If the branch is not `main`, stop. Ask the person what to do. The workflow and the links use `main`.
   - Do not rename a branch before the person agrees. Do not push a new `main` before the person agrees.
4. Copy these files. Do not replace a file that exists. Report each existing file to the person.

   | From `<skill>/` | To the project |
   |---|---|
   | `templates/replication_materials/` | `replication_materials/` |
   | `templates/.replication/site.config.json` | `.replication/site.config.json` |
   | `scripts/` (all files) | `.replication/` |
   | `templates/.github/workflows/replication-site.yml` | `.github/workflows/replication-site.yml` |

   - Replace each placeholder (see `references/record-formats.md`). Ask the person to confirm the owner name and ID.
   - If `docs/superpowers/specs/` or `docs/superpowers/plans/` holds files, ask the person before you move them.
   - Move each one with `git mv` to `replication_materials/plans/YYYY-MM-DD-<topic>-<kind>.md`.
   - Make decision rows from old transcripts only when the person asks.
5. Add `<skill>/templates/CLAUDE-block.md`, with its two marker lines, to the end of `CLAUDE.md`.
   - Make `CLAUDE.md` if it does not exist. If the markers are already in it, do not add the block again.
   - If a `DESCRIPTION` file is at the root, add `^replication_materials$` and `^\.replication$` to `.Rbuildignore`.
6. Turn on Pages: `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`.
   - HTTP 409 means that Pages exists. Read it: `gh api repos/{owner}/{repo}/pages --jq '{build_type, html_url}'`.
   - Find other workflows that deploy to Pages: `grep -l deploy-pages .github/workflows/*.y*ml | grep -v replication-site.yml`.
   - If the build type is `legacy`, or the `grep` command prints a file, the project already has a site. Stop.
   - Give the person the URL of that site. Ask if the record website can replace it.
   - Do not run `gh api -X PUT repos/{owner}/{repo}/pages` before the person says yes. The PUT replaces the site.
   - After a yes for a `legacy` site, run `gh api -X PUT repos/{owner}/{repo}/pages -f build_type=workflow`.
   - After a yes for another workflow, ask the person to remove that workflow. Do not change it yourself.
   - After a no, keep the record without the website. Delete the workflow file.
   - If the build type is `workflow` and the `grep` command prints nothing, continue.
   - If GitHub refuses (for example, a private repository on a free plan), stop. Give the person three choices:
     make the repository public; use a paid plan (GitHub Education gives Pro to teachers); or keep the record without the website.
   - Wait for the choice. For the record without the website, delete the workflow file.
7. Write the first rows.
   - In `replication_materials/README.md`, replace the `[...]` marker with one paragraph of your own.
   - The paragraph states the question of the project and what the record holds.
   - In D1, set Proposed by to the ID of the one who first asked for the record.
   - In the Evidence of D1, replace the `[...]` marker with the words of that request.
   - No `[...]` marker may remain in these two files. Check them with this command. It must print nothing:
     `grep -nE '\[[^]]+\]([^(]|$)' replication_materials/README.md replication_materials/project/decisions.md`
8. Run the build check. Commit the set-up files on `main` and push.
9. Watch the first workflow run. When it passes, report the website URL (commands in `references/site.md`).
   - After the first push, look for the run of the pushed commit:
     `gh run list --workflow replication-site.yml --commit "$(git rev-parse HEAD)" --limit 1`.
   - If no run has started within 60 seconds, start it: `gh workflow run replication-site.yml --ref main`.
   - The workflow template has `workflow_dispatch`, so this command works.
   - Then watch the new run.

## During the work

1. Add a decision row to `project/decisions.md` at the time of each decision, not later.
   - A decision is a choice that changes what is built or how.
   - ID: the next `D` number. Date: today. Source: the session ID.
   - Proposed by and Decided by: write only what the session or the words of the person show. Else write `unknown`.
   - How: an allowed value. A multiple-choice question in Claude Code is `question`.
   - Evidence: a quote of at most 25 words and its date, as `"..." (YYYY-MM-DD)`.
   - For How `question`, quote the label of the chosen option: `"<label>" (YYYY-MM-DD)`.
   - For How `review`, `measurement` or `plan-approval`, you can name the record line in place of a quote.
     An example is `findings/2026-10-19-noise-findings.md, Table 2`.
   - Write nothing else in the Evidence cell.
   - Time (UTC): the time of the decision, from `date -u +%H:%M`.
   - Topic: a row of `## Topics`. Add the row to `## Topics` first when the topic is new.
   - Impact: one phrase on what the decision changes. Replaces: the earlier `D` IDs that this decision replaces. Write both only when they apply.
   - Time, Topic, Impact and Replaces are optional columns. Add them to the header when you first need them. The build reads them by name.
2. When the person accepts an option that Claude Code recommended, write Proposed by `claude` and Decided by the person ID.
3. When the person approves a plan, add or update its row in `## Milestones` of `roadmap.md`.
   - Write each path relative to `replication_materials/`, for example `plans/2026-10-18-m1-plan.md`.
4. At each change of stage, add a row to `project/process.md`. Get the time with `date -u +%Y-%m-%dT%H:%MZ`.
5. Before a paid API call, find its row in `calls/README.md`. If no row exists, stop and propose a row in the chat.
   - Write the row only after the person approves it. Put their ID in Approved by.
   - Never write an approval that the person did not give.
   - Log each call that Claude Code makes in `calls/<service>-calls.csv`. Stop at the limits of the row.
   - Never write a key, a token or an authorization header in any file.
6. At each tag, add a row to `project/releases.md`. Make the file from `<skill>/templates/replication_materials/project/releases.md` when it does not exist.
7. When the work gives a headline result, add a row to `project/results.md`. Make the file from the template when it does not exist.
   - A new result that replaces an old one names it in Replaces. Never edit the old row.
8. When a person checks a classified row and finds it right, add a row to `## Checks` in `decisions.md`. Add the table from the template when it does not exist.
9. `project/contributions.md` is the account of the researchers. Make it from the template when the person asks. Claude Code can draft it. A researcher must approve it.
10. Run the build check after each edit of a record.
11. Commit record changes with no code. This is the record rule:
   - On `main`, commit and push them without asking. Push in small groups, for example at each change of stage.
   - If the code work is in a git worktree, commit the records in the main checkout, on `main`.
   - If the code work is on a branch in the main checkout, commit the records on that branch.
   - On that branch, do not push without asking. The records reach `main` at the merge.
   - After a push to `main`, check that the run of the pushed commit passed:
     `gh run list --workflow replication-site.yml --commit "$(git rev-parse HEAD)" --limit 1`.
12. To show a rendered analysis on the website, add it to `pages` in `.replication/site.config.json`.
   - An example is the HTML of a Quarto or R Markdown file: `{ "file": "analysis.html", "title": "Analysis" }`.
   - The build copies the file alone. Use a self-contained file: `embed-resources: true` in Quarto, `self_contained: true` in R Markdown.
   - Commit the file. Each push to `main` builds the website again.
   - Rules and limits are in `references/site.md`, section Extra pages.

## End of a milestone

1. Find the working ledger `.superpowers/sdd/<plan-basename>/progress.md`. Its first line is `# SDD ledger — plan: <path>`.
   - Copy it before the superpowers skills delete that folder.
   - If no working ledger exists, tell the person. Do not write a ledger from memory.
2. Copy the ledger under the header with this command. The copy takes the date and topic of the plan file.

   ```bash
   work=.superpowers/sdd/<plan-basename>/progress.md
   plan=$(sed -n '1s/^# SDD ledger — plan: //p' "$work")
   copy=replication_materials/plans/$(basename "$plan" -plan.md)-ledger.md
   { sed -e "s|{{PLAN_PATH}}|$plan|g" -e "s|{{DATE}}|$(date -u +%F)|g" "<skill>/templates/ledger-header.md"; cat "$work"; } > "$copy"
   ```

3. In the copy, remove each internal agent ID. Change nothing else.
   - Keep each `Task <n>: complete` line. The Progress page counts these lines.
   - Keep each `Ruling` line. The Decisions page reads the rulings from the ledger.
   - Do not rewrite the ledger as a table or a summary.
4. Do not copy a ruling into `decisions.md`. A copy makes a second record of the same ruling.
5. In `roadmap.md`, set the State of the milestone to `done`.
   - Set its Ledger to the path of the copy, relative to `replication_materials/`: `plans/<date>-<topic>-ledger.md`.
   - Set the milestone at `next` to `now`. If no milestone is at `next`, use the first `planned` one.
   - Then set the first `planned` milestone, if one exists, to `next`.
6. If a deferred item in the ledger blocks a later milestone, add it to `## Open items`.
7. Add a row to `process.md` for the end of the milestone. Use the stage of the work that ended.
8. Run the build check. Commit the record by the record rule (During the work, step 11).

## Correction

1. Add one row to `## Corrections` in `project/decisions.md` for each field that changes.
   - Decision: the `D` ID, or the ruling ID `R-<date>-<topic>-<n>` from the Decisions page.
   - Field: `Decision`, `Proposed by`, `Decided by`, `How` or `Evidence`.
   - Checked by: the ID of the person who checked the record. Claude Code can write the row for that person.
2. Do not change or delete the original row or the ledger line.
3. Run the build check. Commit the record by the record rule (During the work, step 11).

## Update

1. Compare the version line of `.replication/build-site.mjs` and of the workflow with the files in `<skill>/`.
2. Replace `.replication/build-site.mjs` and the full `.replication/lib/` folder with the files in `<skill>/scripts/`.
3. Replace the workflow with `<skill>/templates/.github/workflows/replication-site.yml`.
4. In `CLAUDE.md`, replace the block from its start marker to its end marker with `<skill>/templates/CLAUDE-block.md`.
   - Keep all other text of `CLAUDE.md`.
5. Never replace a record. Do not change `replication_materials/` or `.replication/site.config.json`.
   - Version 1.2.0 adds `releases.md`, `results.md`, `contributions.md`, the `## Topics` and `## Checks` tables, and the decision columns Time (UTC), Topic, Impact and Replaces.
   - They are all optional. A project adds each one when it first needs it (During the work). The update adds none of them.
6. Run the build check. Commit these files alone. Ask the person before you push: this commit is not record-only.

## Red flags

| Thought | Fact |
|---|---|
| "There is nothing to pin yet, so I keep it light." | The record starts at set-up. Use the full structure. |
| "I can make the files now and add the remote later." | With no remote, stop. Create no file. |
| "A table of tasks is easier to read than the raw ledger." | Copy the ledger lines as they are. The Progress page counts `Task <n>: complete` lines. |
| "A ruling is a decision, so it goes in `decisions.md`." | The build reads rulings from the ledger copy. |
| "`milestone-close` is a better stage name." | Use only the allowed values. |
| "The edit is small, so the build will pass." | Run the build check after each edit. |
| "The contributions page is done. I wrote it." | Claude Code can draft `contributions.md`. It is not complete until a researcher approves it. |
| "A new result replaces the old one, so I fix the old row." | Never edit an old result. Add a row that names it in Replaces. |
| "A short note in Evidence helps the reader." | Evidence holds a quote and its date, or the name of a record line. Nothing else. |
| "The cost is small. The person will approve it." | Make no paid call before the person approves a budget row. |
| "Pages exists, so I set its build type to `workflow`." | That can replace the site of the project. Ask the person first. |
