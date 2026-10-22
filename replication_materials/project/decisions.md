# Decisions

## Decisions

| ID | Date | Decision | Proposed by | Decided by | How | Evidence | Source |
|---|---|---|---|---|---|---|---|
| D1 | 2026-10-19 | The skill is primarily for Fadel; other researchers come second. | fmm | fmm | chat | "it is primarily for me so I can ensure that any research project of mine I capture how I developed the code" (2026-10-19) | session b36ad167 |
| D2 | 2026-10-19 | Keep the four jobs of the EXPERTA folder, but lighter. | claude | fmm | chat | "Looks right, keep all of it but lighter" (2026-10-19) | session b36ad167 |
| D3 | 2026-10-19 | All writing follows the 80% ASD-STE100 rule. | fmm | fmm | chat | "use the 80% ASD-STE100 rule in all the writing as well" (2026-10-19) | session b36ad167 |
| D4 | 2026-10-19 | The shared record is one living website that GitHub Actions updates. | fmm | fmm | chat | "I prefer the end outcome of a single artifact that gets updated with GitHub actions that captures everything" (2026-10-19) | session b36ad167 |
| D5 | 2026-10-19 | A project without a remote stops at set-up; the skill asks for a remote with CI. | fmm | fmm | chat | "it should ask the user to create a GitHub (or other type of remote) that has automation" (2026-10-19) | session b36ad167 |
| D6 | 2026-10-19 | GitHub Pages is acceptable in place of an artifact. | fmm | fmm | chat | "if its easier to keep it as a GitHub page, I would be happy with that as well" (2026-10-19) | session b36ad167 |
| D7 | 2026-10-19 | Test the CI route in a throwaway public repository. | claude | fmm | chat | "You can do a throwaway public repo -- this is perfectly fine by me." (2026-10-19) | session b36ad167 |
| D8 | 2026-10-19 | A public records website is acceptable. | claude | fmm | chat | "I am fine with having it public since I will eventually make the code public anyways." (2026-10-19) | session b36ad167 |
| D9 | 2026-10-19 | Records are markdown tables, not JSON. | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D10 | 2026-10-19 | Pages render the markdown in the browser (marked, KaTeX). | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D11 | 2026-10-19 | Set-up adds a block to the project `CLAUDE.md`. | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D12 | 2026-10-19 | Specs and plans of the superpowers skills go to `replication_materials/plans/`. | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D13 | 2026-10-19 | The skill lives in a public repository and keeps its own record. (D16 sets the repository.) | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D14 | 2026-10-19 | In R packages, set-up adds `^replication_materials$` to `.Rbuildignore`. | claude | fmm | playback | "Looks right, go ahead and write it up" (2026-10-19) | session b36ad167 |
| D15 | 2026-10-19 | Claude Code commits and pushes changes that touch only `replication_materials/` to `main` without asking, so the website is current during a milestone. Code follows the normal branch flow. | claude | fmm | question | "Yes, records to main (Recommended)" (2026-10-19) | session b36ad167 |
| D16 | 2026-10-19 | One public repository, `fmegahed/claude-skills`, holds all the skills of Fadel. It has one record and one website for the whole repository. | fmm | fmm | chat | "Would it be better to have a single repo with all my claude skills ... should I just call the repo claude-skills?" (2026-10-19) | session b36ad167 |
| D17 | 2026-10-19 | The `narrated-demo-video` skill moves into the repository without change. Its generalization for a wider audience is a later milestone with its own design. | fmm | fmm | chat | "Should my repo contain boths skills for now and it grows?" (2026-10-19) | session b36ad167 |
| D18 | 2026-10-19 | The default theme of all skills is the Miami University palette, from the brand guide. | fmm | fmm | chat | "the default color for theming purposes for both is Miami red and we should leverage colors from https://miamioh.edu/brand/style/" (2026-10-19) | session b36ad167 |
| D19 | 2026-10-19 | Everything conforms to WCAG 2.2 AA. | fmm | fmm | chat | "Also build everything to WCAG 2.2 if possible?" (2026-10-19) | session b36ad167 |
| D20 | 2026-10-19 | The website has a light theme only. | claude | fmm | question | "Light theme only (Recommended)" (2026-10-19) | session b36ad167 |
| D21 | 2026-10-19 | The video skill uses ElevenLabs when the user gives an API key, and else the free Microsoft neural voices. This applies to the generalization of the video skill (O6), not to version 1 of this repository. | fmm | fmm | chat | "For the video, use ELEVEN_LABS_API if the user is willing to provide an API key for them. Otherwise, use the free microsoft neural voices." (2026-10-19) | session b36ad167 |
| D22 | 2026-10-20 | Use short, direct section headers in the record README template (Folders, Local build). | fmm | fmm | chat | "Yes update the template." (2026-10-20) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D23 | 2026-10-20 | The website can show extra pages: site.config.json lists project files (for example a rendered analysis), the build copies them to pages/ and links them, and the workflow runs on each push to main. | claude | fmm | chat | "Add the skill feature, and publish F1 with attribution" (2026-10-20) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D24 | 2026-10-20 | Add releases, results, a timeline, a contributions page and more decision detail to replication-materials (version 1.2.0); all are optional. Plan: fine_tuned_jev replication_materials/plans/2026-10-20-record-additions-plan.md. | fmm | fmm | chat | "Improve the replication record as well -- the level of details can benefit from some additions" (2026-10-20) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D25 | 2026-10-20 | The record must show the intellectual contributions and decisions of the researchers, and mark each decision that no person checked. | fmm | fmm | chat | "I want this to be our honest guide of how we co-worked with Claude Code while highlighting the intellectual contributions" (2026-10-20) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D26 | 2026-10-22 | Version 1.2.1 of replication-materials: the build joins each budget row to its call log by name (Service is the <service> of calls/<service>-calls.csv) and stops on a call log that no budget row names. A budget row with no call log still builds, so older records with readable Service names and no logs do not break. The record format and SKILL.md state the naming rule. | claude | claude | chat | "Fix the skill with the best solution and push it" (2026-10-22) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D27 | 2026-10-22 | Version 1.3.0 of replication-materials: the navigation of the website has two labelled groups, one for each kind of reader: "How we worked with Claude Code" on the left and "Rerun and build on it" at the right edge, with the repository last. An extra page goes in the second group, unless its group in site.config.json is record. | claude | fmm | question | "Two groups, one bar (Recommended)" (2026-10-22) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |
| D28 | 2026-10-22 | The order in each group follows the questions of its reader. Record: Home, Contributions, Decisions, Timeline, Progress, Process, Records (the account first, then its evidence, then the work over time, then the documents). Reuse: Results, the extra pages, Releases, Repository (what the project found, how to make it again, the versions, the code). The Home page lists the pages in the same groups. | claude | claude | ruling | "Also think of the natural order within a group, i.e. tab orders within a group" (2026-10-22) | b36ad167-66f5-45af-9d6c-bf3f817c6f58 |

## Corrections

To correct a decision, add one row to this table. Name the person who checked it. The original row stays above.

| Decision | Field | New value | Checked by | Date | Note |
|---|---|---|---|---|---|
