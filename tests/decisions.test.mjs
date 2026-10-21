import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTables } from "../skills/replication-materials/scripts/lib/tables.mjs";
import {
  readPeople, readDecisions, readRulings, readCorrectionsTable, applyCorrections, readTopics, readChecksTable, applyChecks,
} from "../skills/replication-materials/scripts/lib/decisions.mjs";

const ROADMAP = `# Roadmap

## People

| ID | Name | Role | Link |
|----|------|------|------|
| fmm | Fadel M. Megahed | PI | https://example.org/fmm |
| ab | Ann B. | RA | |
`;

const DECISIONS = `# Decisions

## Decisions

| ID | Date | Decision | Proposed by | Decided by | How | Evidence | Source |
|----|------|----------|-------------|------------|-----|----------|--------|
| D1 | 2026-10-01 | Use Poisson | claude | fmm | chat | thread 4 | notes.md |
| D2 | 2026-10-02 | Drop site 9 | claude, ab | fmm, ab | review | table 2 | notes.md |
`;

const CORRECTIONS = `
## Corrections

| Decision | Field | New value | Checked by | Date | Note |
|----------|-------|-----------|------------|------|------|
| D2 | Decided by | fmm | fmm | 2026-10-05 | ab only reviewed |
`;

const people = () => readPeople(ROADMAP, "roadmap.md");

test("reads two decisions and resolves people", () => {
  const p = people();
  assert.equal(p.get("fmm").name, "Fadel M. Megahed");
  assert.equal(p.get("claude").name, "Claude Code");
  assert.equal(p.get("claude").role, "");
  const ds = readDecisions(DECISIONS, "project/decisions.md", p);
  assert.equal(ds.length, 2);
  assert.deepEqual(ds[0].decidedBy, ["fmm"]);
  assert.equal(ds[0].how, "chat");
  assert.deepEqual(ds[1].proposedBy, ["claude", "ab"]);
  assert.equal(ds[0].corrected, null);
  assert.equal(ds[0].file, "project/decisions.md");
  assert.equal(ds[0].line, 7);
});

test("a People row with a built-in ID throws", () => {
  for (const id of ["claude", "subagent", "unknown"]) {
    const bad = ROADMAP + `| ${id} | Someone Else | RA | - |\n`;
    assert.throws(() => readPeople(bad, "project/roadmap.md"),
      new RegExp(`^RecordFormatError: project/roadmap\\.md:9: ID "${id}" is a built-in ID`), id);
  }
  assert.equal(readPeople(ROADMAP + "| constructor | C. Name | RA | - |\n", "r.md").get("constructor").name, "C. Name");
});

test("unknown person ID throws", () => {
  const bad = DECISIONS.replace("| fmm | chat", "| xyz | chat");
  assert.throws(() => readDecisions(bad, "project/decisions.md", people()),
    /decisions\.md:\d+: unknown person "xyz"/);
});

test("bad How value throws", () => {
  const bad = DECISIONS.replace("| chat |", "| shouting |");
  assert.throws(() => readDecisions(bad, "project/decisions.md", people()),
    /How "shouting".*chat, question, review, measurement, plan-approval, playback, ruling, classified/);
});

test("duplicate decision ID throws", () => {
  const bad = DECISIONS + "| D1 | 2026-10-03 | Again | claude | fmm | chat | x | y |\n";
  assert.throws(() => readDecisions(bad, "project/decisions.md", people()), /duplicate decision ID "D1"/);
});

const LEDGER = [
  "# Ledger",
  "Ruling: a",
  "- Ruling: b",
  "Ruling 3: c",
  "- Ruling 4: d",
  "- `Ruling: e`",
  "Task 4: Ruling: f",
  "Final: Ruling: g",
].join("\n");
const LEDGER_PATH = "plans/2026-10-15-m1-execution-ledger.md";

test("rulings in all seven line forms", () => {
  const rs = readRulings(LEDGER, LEDGER_PATH);
  assert.equal(rs.length, 7);
  assert.deepEqual(rs.map((r) => r.text), ["a", "b", "c", "d", "e", "f", "g"]);
  assert.equal(rs[0].id, "R-2026-10-15-m1-execution-1");
  assert.equal(rs[6].id, "R-2026-10-15-m1-execution-7");
  assert.equal(rs[0].date, "2026-10-15");
  assert.deepEqual(rs[0].proposedBy, ["claude"]);
  assert.deepEqual(rs[0].decidedBy, ["claude"]);
  assert.equal(rs[0].how, "ruling");
  assert.equal(rs[0].source, `${LEDGER_PATH}:2`);
  assert.equal(rs[0].file, LEDGER_PATH);
  assert.equal(rs[0].line, 2);
  assert.equal(rs[0].corrected, null);
});

test("a ruling has the same shape as a decision row (M12)", () => {
  const [r] = readRulings(LEDGER, LEDGER_PATH);
  assert.equal(r.time, null);
  assert.equal(r.topic, null);
  assert.equal(r.impact, null);
  assert.deepEqual(r.replaces, []);
  assert.deepEqual(r.checks, []);
  assert.equal(r.checked, true);
  const [d] = readDecisions(DECISIONS, "project/decisions.md", people());
  assert.deepEqual(Object.keys(r).sort(), Object.keys(d).sort());
});

test("prose that mentions Ruling: mid-line is not a ruling", () => {
  const text = [
    "Ruling: real",
    "Task 3: minor (deferred): empty ruling text (`Ruling: ` with only spaces) shifts the numbering.",
    "See the note. Ruling: not a ruling either",
    "| T3 -> T4 | readRulings | See Ruling 3: a table cell |",
    "Task 13b: Ruling: second",
  ].join("\n");
  assert.deepEqual(readRulings(text, LEDGER_PATH).map((r) => r.text), ["real", "second"]);
});

test("a ruling that starts or ends with inline code keeps it", () => {
  const text = [
    "Ruling 3: `readDecisions` returns `corrected: null`.",
    "Ruling: keep `a` and `b`",
    "- `Ruling: wrapped`",
  ].join("\n");
  assert.deepEqual(readRulings(text, LEDGER_PATH).map((r) => r.text),
    ["`readDecisions` returns `corrected: null`.", "keep `a` and `b`", "wrapped"]);
});

test("ruling inside a code fence is ignored", () => {
  const text = "Ruling: real\n```\nRuling: fake\n```\n";
  assert.deepEqual(readRulings(text, LEDGER_PATH).map((r) => r.text), ["real"]);
});

test("ledger file name without a date throws", () => {
  assert.throws(() => readRulings(LEDGER, "plans/m1-execution-ledger.md"),
    /m1-execution-ledger\.md:1: .*YYYY-MM-DD/);
});

test("correction replaces one field and records who checked it", () => {
  const p = people();
  const ds = readDecisions(DECISIONS + CORRECTIONS, "project/decisions.md", p);
  const table = readCorrectionsTable(DECISIONS + CORRECTIONS, "project/decisions.md");
  const out = applyCorrections(ds, table, p, "project/decisions.md");
  const d2 = out.find((d) => d.id === "D2");
  assert.deepEqual(d2.decidedBy, ["fmm"]);
  assert.equal(d2.corrected.by, "Fadel M. Megahed");
  assert.equal(d2.corrected.date, "2026-10-05");
  assert.deepEqual(d2.corrected.fields, ["Decided by"]);
  assert.deepEqual(d2.corrected.notes, ["ab only reviewed"]);
  assert.deepEqual(d2.corrected.byIds, ["fmm"]);
  assert.equal(d2.evidence, "table 2");
  assert.equal(ds[1].corrected, null);
  assert.deepEqual(ds[1].decidedBy, ["fmm", "ab"]);
  assert.equal(out.find((d) => d.id === "D1").corrected, null);
});

test("correction of an unknown decision throws", () => {
  const bad = CORRECTIONS.replace("| D2 |", "| D9 |");
  const text = DECISIONS + bad;
  const p = people();
  assert.throws(() => applyCorrections(readDecisions(text, "project/decisions.md", p),
    readCorrectionsTable(text, "project/decisions.md"), p, "project/decisions.md"),
    /decisions\.md:\d+: .*unknown decision "D9"/);
});

test("corrections accumulate, reach rulings, and reject unknown fields", () => {
  const p = people();
  const rs = readRulings("Ruling: a\n", LEDGER_PATH);
  const rows = (...r) => parseTables(
    "## Corrections\n\n| Decision | Field | New value | Checked by | Date | Note |\n|--|--|--|--|--|--|\n" + r.join("\n") + "\n", "f.md")[0];
  const t = rows(
    "| R-2026-10-15-m1-execution-1 | Decision | b | fmm | 2026-10-16 | n1 |",
    "| R-2026-10-15-m1-execution-1 | Evidence | e | fmm | 2026-10-16 | n2 |");
  const out = applyCorrections(rs, t, p, "f.md");
  assert.equal(out[0].text, "b");
  assert.deepEqual(out[0].corrected.fields, ["Decision", "Evidence"]);
  assert.deepEqual(out[0].corrected.notes, ["n1", "n2"]);
  const badField = rows("| R-2026-10-15-m1-execution-1 | Date | x | fmm | 2026-10-16 | n |");
  assert.throws(() => applyCorrections(rs, badField, p, "f.md"), /Decision, Proposed by, Decided by, How, Evidence/);
  const badWho = rows("| R-2026-10-15-m1-execution-1 | Decision | x | zzz | 2026-10-16 | n |");
  assert.throws(() => applyCorrections(rs, badWho, p, "f.md"), /f\.md:\d+: unknown person "zzz"/);
});

test("readCorrectionsTable returns null when absent", () => {
  assert.equal(readCorrectionsTable(DECISIONS, "project/decisions.md"), null);
});

const HEAD = "| ID | Date | Time (UTC) | Decision | Proposed by | Decided by | How | Evidence | Source | Topic | Impact | Replaces |\n" +
  "|----|------|------|----|----|----|----|----|----|----|----|----|\n";
const TOPICS = "\n## Topics\n\n| Topic | Meaning |\n|---|---|\n| prompts | Prompt wording. |\n| data | Data sources. |\n";
const row = (id, o = {}) => {
  const v = { time: "-", how: "chat", topic: "-", impact: "-", replaces: "-", ...o };
  return `| ${id} | 2026-10-01 | ${v.time} | Text | claude | fmm | ${v.how} | - | n.md | ${v.topic} | ${v.impact} | ${v.replaces} |
`;
};
const rd = (rows, extra = TOPICS) => readDecisions(`## Decisions

${HEAD}${rows}${extra}`, "decisions.md", people());

test("a table without the optional columns gives null and empty values", () => {
  const [d] = readDecisions(DECISIONS, "project/decisions.md", people());
  assert.equal(d.time, null);
  assert.equal(d.topic, null);
  assert.equal(d.impact, null);
  assert.deepEqual(d.replaces, []);
  assert.deepEqual(d.checks, []);
  assert.equal(d.checked, true);
});

test("Time (UTC) must look like HH:MM", () => {
  assert.equal(rd(row("D1", { time: "21:05" }))[0].time, "21:05");
  assert.equal(rd(row("D1", { time: "-" }))[0].time, null);
  assert.equal(rd(row("D1", { time: "" }))[0].time, null);
  for (const t of ["25:00", "9:05"]) {
    assert.throws(() => rd(row("D1", { time: t })), new RegExp(`decisions\\.md:\\d+: Time \\(UTC\\) "${t}" must look like 14:30\\.`));
  }
});

test("Topic must be in the Topics table", () => {
  assert.equal(rd(row("D1", { topic: "data" }))[0].topic, "data");
  assert.equal(rd(row("D1", { topic: "-" }))[0].topic, null);
  assert.throws(() => rd(row("D1", { topic: "stats" })), /Topic "stats" is not in ## Topics\. Use one of: prompts, data\./);
  assert.throws(() => rd(row("D1"), ""), /a Topic column needs a ## Topics table/);
  assert.deepEqual(readTopics(`## Decisions\n${TOPICS}`, "d.md"), [
    { topic: "prompts", meaning: "Prompt wording." }, { topic: "data", meaning: "Data sources." }]);
  assert.deepEqual(readTopics(DECISIONS, "d.md"), []);
  assert.deepEqual(rd(row("D1"), "\n## Topics\n\n| Topic | Meaning |\n|---|---|\n").map((d) => d.topic), [null]);
});

test("Replaces lists earlier decisions", () => {
  const rows = row("D1") + row("D2") + row("D3") + row("D4") + row("D5", { replaces: "D3, D4" });
  assert.deepEqual(rd(rows)[4].replaces, ["D3", "D4"]);
  assert.deepEqual(rd(row("D1") + row("D2", { replaces: "-" }))[1].replaces, []);
  assert.throws(() => rd(row("D4") + row("D7") + row("D5", { replaces: "D7" })), /D5 cannot replace a later decision D7\./);
  assert.throws(() => rd(row("D4", { replaces: "D99" })), /unknown decision "D99"/);
  assert.throws(() => rd(row("D4") + row("D5", { replaces: "R-2026-10-05-a-1" })), /must be a decision ID like D3/);
});

test("checked is false only for an unchecked classified decision", () => {
  const ds = rd(row("D1", { how: "classified" }) + row("D2", { how: "review" }) + row("D3", { how: "classified" }));
  assert.deepEqual(ds.map((d) => d.checked), [false, true, false]);
  const corr = readCorrectionsTable(CORRECTIONS.replace("D2", "D1"), "d.md");
  const fixed = applyCorrections(ds, corr, people(), "d.md");
  assert.deepEqual(fixed.map((d) => d.checked), [true, true, false]);
  const checks = readChecksTable("## Checks\n\n| Decision | Checked by | Date | Note |\n|---|---|---|---|\n| D3 | ab | 2026-10-06 | Looks right. |\n", "d.md");
  const done = applyChecks(fixed, checks, people(), "d.md");
  assert.deepEqual(done.map((d) => d.checked), [true, true, true]);
  assert.deepEqual(done[2].checks, [{ by: "Ann B.", byId: "ab", date: "2026-10-06", note: "Looks right." }]);
  assert.deepEqual(done[0].checks, []);
  assert.deepEqual(fixed[2].checks, [], "applyChecks does not change its input");
  assert.equal(readChecksTable(DECISIONS, "d.md"), null);
});

const CHECKS_HEAD = "## Checks\n\n| Decision | Checked by | Date | Note |\n|---|---|---|---|\n";

test("each Checks row adds a check, in row order (M1)", () => {
  const ds = rd(row("D1", { how: "classified" }));
  const t = readChecksTable(CHECKS_HEAD + "| D1 | ab | 2026-10-06 | First. |\n| D1 | fmm | 2026-10-07 | Second. |\n", "d.md");
  const [d] = applyChecks(ds, t, people(), "d.md");
  assert.deepEqual(d.checks, [
    { by: "Ann B.", byId: "ab", date: "2026-10-06", note: "First." },
    { by: "Fadel M. Megahed", byId: "fmm", date: "2026-10-07", note: "Second." },
  ]);
  assert.equal(d.checked, true);
});

test("a Checks row with a built-in ID throws: only a person can check a decision (I1)", () => {
  const ds = rd(row("D1", { how: "classified" }));
  for (const id of ["claude", "subagent", "unknown"]) {
    assert.throws(() => applyChecks(ds, readChecksTable(CHECKS_HEAD + `| D1 | ${id} | 2026-10-06 | x |\n`, "d.md"), people(), "d.md"),
      (e) => e.name === "RecordFormatError"
        && e.message === `d.md:5: Checked by "${id}" must be a person of ## People. Only a person can check a decision.`, id);
  }
});

test("a correction by a built-in ID is valid but keeps the mark (I1)", () => {
  const corr = (...r) => readCorrectionsTable(
    "## Corrections\n\n| Decision | Field | New value | Checked by | Date | Note |\n|--|--|--|--|--|--|\n" + r.join("\n") + "\n", "d.md");
  const ds = rd(row("D1", { how: "classified" }) + row("D2", { how: "chat" }));
  const byClaude = applyCorrections(ds, corr(
    "| D1 | Evidence | e | claude | 2026-10-06 | n |",
    "| D1 | How | chat | subagent | 2026-10-06 | n |",
    "| D2 | How | classified | unknown | 2026-10-06 | n |"), people(), "d.md");
  assert.deepEqual(byClaude.map((d) => d.checked), [false, false], "a How change by a built-in ID keeps or adds the mark");
  assert.deepEqual(byClaude[0].corrected.byIds, ["claude", "subagent"]);
  assert.equal(byClaude[0].how, "chat");
  const mixed = applyCorrections(ds, corr(
    "| D1 | Evidence | e | fmm | 2026-10-06 | n |",
    "| D1 | Decision | t | claude | 2026-10-07 | n |"), people(), "d.md");
  assert.equal(mixed[0].checked, true, "a correction by a person counts");
  assert.deepEqual(mixed[0].corrected.byIds, ["fmm", "claude"]);
  assert.equal(mixed[0].corrected.by, "Claude Code");
});

test("a Checks row with an unknown decision or person throws with its line", () => {
  const head = "## Checks\n\n| Decision | Checked by | Date | Note |\n|---|---|---|---|\n";
  const ds = rd(row("D1", { how: "classified" }));
  assert.throws(() => applyChecks(ds, readChecksTable(head + "| D9 | ab | 2026-10-06 | x |\n", "d.md"), people(), "d.md"),
    /d\.md:5: check names unknown decision "D9"/);
  assert.throws(() => applyChecks(ds, readChecksTable(head + "| D1 | zz | 2026-10-06 | x |\n", "d.md"), people(), "d.md"),
    /d\.md:5: unknown person "zz"/);
});

test("a Topics row with an empty or a duplicate Topic throws with its line (M7)", () => {
  const topics = (...r) => `## Decisions\n\n## Topics\n\n| Topic | Meaning |\n|---|---|\n${r.join("\n")}\n`;
  assert.throws(() => readTopics(topics("| data | A. |", "| data | B. |"), "d.md"),
    (e) => e.name === "RecordFormatError" && e.message === 'd.md:8: duplicate topic "data".');
  for (const empty of ["", "-"]) {
    assert.throws(() => readTopics(topics("| data | A. |", `| ${empty} | B. |`), "d.md"),
      (e) => e.name === "RecordFormatError"
        && e.message === "d.md:8: the Topic cell is empty. Write a topic or remove the row.", `"${empty}"`);
  }
  assert.throws(() => rd(row("D1"), "\n## Topics\n\n| Topic | Meaning |\n|---|---|\n| data | A. |\n| data | B. |\n"),
    /duplicate topic "data"/);
});
