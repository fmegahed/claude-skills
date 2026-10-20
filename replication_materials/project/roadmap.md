# Roadmap

## People

| ID | Name | Role | Link |
|---|---|---|---|
| fmm | Fadel M. Megahed | Owner | https://miamioh.edu/fsb/directory/?up=/directory/megahefm |

## Milestones

| ID | Milestone | State | Plan | Ledger |
|---|---|---|---|---|
| M1 | Replication-materials skill, version 1 | done | plans/2026-10-19-replication-skill-plan.md | plans/2026-10-19-replication-skill-ledger.md |
| M2 | narrated-demo-video for a wider audience | planned | - | - |

## Open items

| ID | Item | Blocks | Owner |
|---|---|---|---|
| O1 | Publish the site to a claude.ai artifact from CI, for records that must stay private. The test job exists in the test repository. It needs a `CLAUDE_CODE_OAUTH_TOKEN` secret. Not tested. | - | claude |
| O2 | Support hosts other than GitHub. | - | claude |
| O3 | Delete the test repository `fmegahed/replication-site-spike`. It now also hosts the acceptance test site (setup-test). Keep it until Fadel decides. `gh` needs the `delete_repo` scope (`gh auth refresh -s delete_repo`), or Fadel deletes it on github.com. | - | fmm |
| O4 | Add a plugin marketplace file (`.claude-plugin/marketplace.json`) so that other researchers can install each skill with `/plugin`. | - | claude |
| O5 | Check the use rules for the Miami logo and the Ohio BWC logo in a public repository. Until then, the logos stay out of git. | - | fmm |
| O6 | Generalize `narrated-demo-video` for a wider audience (D17). Start from D21: ElevenLabs when the user gives a key, else Microsoft neural voices. | M2 | claude |
