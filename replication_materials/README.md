# claude-skills

This repository holds the Claude Code skills of Fadel M. Megahed. The first skill is `replication-materials`. It keeps a replication record of a research project: how the code came to be, who decided what, and where the work is. Claude Code made the skill with Fadel in one session on 2026-10-19, with a brainstorm, a design, a builder check, a plan and a build by subagents. This folder is the record of that work. It is also the first use of the skill. The site that GitHub Actions builds from this folder is the living record.

People: Fadel M. Megahed (Owner). The full list is in `project/roadmap.md`.

## What each folder holds

| Folder | What it holds |
|---|---|
| `plans/` | Specs, plans and ledgers. The names are `YYYY-MM-DD-<topic>-<kind>.md`. |
| `probes/` | One folder for each probe, with scripts and a README. |
| `findings/` | The findings of each probe, with the script and the output. |
| `calls/` | The budgets in `README.md` and the logs of paid calls in `<service>-calls.csv`. This repository makes no paid call. |
| `project/` | The roadmap, the decisions and the process events. |
| `environment/` | Session information, lock files and software versions. |

## Build the site on your computer

1. Install Node 22.
2. Open a terminal in the root folder of the repository.
3. Run `node .replication/build-site.mjs --out _site`.
4. Open `_site/index.html` in a browser.
