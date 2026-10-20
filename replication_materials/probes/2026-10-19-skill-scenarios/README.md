# Probe: skill scenarios (writing-skills test of the replication-materials skill)

| Item | Value |
|---|---|
| Status | Done |
| Date | 2026-10-19 |
| Written by | Claude Code (Opus 5.5) |

This probe tested the skill text with the test-first method of the superpowers writing-skills skill. Fresh subagents acted as Claude Code in scratch projects. Each scenario ran twice: first without the skill (baseline), then with the skill.

| File | What it measures |
|---|---|
| `make-scenarios.mjs` | Builds the four scratch projects from the templates: set-up with no remote, a decision, the end of a milestone, a paid-call request. |
| `baseline.md` | What four agents did without the skill. Two failed: set-up invented its own folder, and the milestone close broke the build. |
| `with-skill.md` | The same four scenarios with the skill. All four passed. The controller checked each folder with `git status` and the build. |

## Run

```bash
node make-scenarios.mjs <path to claude-skills> <output folder> <tag>
```

The scenario prompts are in the session transcript `b36ad167` (Task 9 of the execution ledger).

## Versions and calls

- Node 22.14.0. Subagents: Sonnet 5.5. Skill commit `189d07a`.
- No paid API call. No network call. No GitHub change.
