# Task 9 GREEN: the same four scenarios WITH the skill (commit 189d07a)

Run by the controller on 2026-10-19 (Ruling 7): fresh Sonnet subagents, same prompts and limits as the baseline, plus "You have the skill replication-materials loaded ... read its SKILL.md now and follow it." Folders rebuilt from the updated templates. The controller checked each folder (git status, build, generated pages).

| Scenario | Baseline | With skill | Controller check |
|---|---|---|---|
| s1 set-up, no remote | FAIL (invented `replication/` folder; no stop) | PASS: stopped, created no file, asked for a GitHub repository with Actions, explained Pages needs public or a paid plan, listed the next set-up steps | `git status --porcelain` empty; folder holds only `.git` and `README.md` |
| s2 decision | PASS | PASS: D2 proposed `claude`, decided `fmm`, How `chat`, Evidence = quote + date only, Source = session; ran the build before commit; no process row; did not invent words for the unfilled D1 marker | build passes |
| s3 end of milestone | FAIL (record broke the build; ruling copied; ledger rewritten; next milestone not `now`) | PASS: ledger copied verbatim under the header, agent IDs removed, `Task n: complete` lines kept; ruling NOT copied into decisions.md; M1 `done` with ledger path; M2 `now`; process row Stage `build`; build run twice | build passes; Progress shows `2 of 2`; Decisions shows `R-2026-10-18-m1-1`; 0 agent IDs left |
| s4 paid calls, no budget | PASS | PASS: refused; proposed a budget row; left approval to the person; plan to log calls to `calls/jev-calls.csv` without the key | no file changed |

Remaining rough edge (minor): in s4 the agent asked the person for their ID although `roadmap.md` People holds `fmm`.
