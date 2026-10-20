import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTables } from "../skills/replication-materials/scripts/lib/tables.mjs";
import {
  readPeople, readDecisions, readRulings, readCorrectionsTable, applyCorrections,
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
