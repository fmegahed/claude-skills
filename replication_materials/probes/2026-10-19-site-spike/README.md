# Probe: Pages site from markdown records

This probe checks that a workflow can build one page from markdown records and deploy it to GitHub Pages. The files are in the throwaway public repository https://github.com/fmegahed/replication-site-spike. The repository is not part of this one.

| File | What it measures |
|---|---|
| `scripts/build-site.mjs` | Builds one page from the three records. |
| `.github/workflows/site.yml` | Builds the page and deploys it to Pages. |
| The three record files | The input of the build: a roadmap, a decisions table and a process table. |

## What the probe measured

- The Pages build and deploy works.
- A push of one changed record (commits `7e7b56d` and `de4b394`) updated the live site in about one minute.
- The SHA pins of the actions agree with their tags: checkout v7.0.1, setup-node v7.0.0, upload-pages-artifact v5.0.0, configure-pages v6.0.0 and deploy-pages v5.0.1.
- marked 12.0.2 and KaTeX 0.16.9 are on cdnjs. Tables and inline math render on the live page.

## Run

Push a change of one record to `main` in the spike repository. Watch the workflow run on GitHub.

## Software versions

- marked 12.0.2
- KaTeX 0.16.9
- Node 22

## Date

2026-10-19

## Live calls

None. The probe made no paid call.
