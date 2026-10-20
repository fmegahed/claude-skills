import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadProject, parseCsv, FORMAT_VERSION } from "../skills/replication-materials/scripts/lib/project.mjs";

const OPTS = { gitSha: "abc1234", buildDate: "2026-10-19" };
const model = () => loadProject("tests/fixtures/full", OPTS);

function tempCopy() {
  const dir = mkdtempSync(join(tmpdir(), "rm-project-"));
  cpSync("tests/fixtures/full", dir, { recursive: true });
  return dir;
}

test("status is the now and next milestones", () => {
  const m = model();
  assert.equal(m.status.current.id, "M2");
  assert.equal(m.status.next.id, "M3");
  assert.equal(FORMAT_VERSION, 1);
});

test("task counts from plan and ledger", () => {
  const m2 = model().milestones.find((m) => m.id === "M2");
  assert.equal(m2.tasksDone, 2);
  assert.equal(m2.tasksTotal, 3);
  const m1 = model().milestones.find((m) => m.id === "M1");
  assert.equal(m1.tasksDone, null);
  assert.equal(m1.plan, null);
});

test("decisions include rulings after D rows", () => {
  const ds = model().decisions;
  assert.deepEqual(ds.map((d) => d.id), ["D1", "D2", "D3", "R-2026-10-05-alpha-1", "R-2026-10-05-alpha-2"]);
  const d3 = ds.find((d) => d.id === "D3");
  assert.deepEqual(d3.decidedBy, ["fmm"]);
  assert.ok(d3.corrected);
});

test("a correction of a ruling ID applies", () => {
  const dir = tempCopy();
  try {
    const p = join(dir, "replication_materials/project/decisions.md");
    writeFileSync(p, readFileSync(p, "utf8") + "| R-2026-10-05-alpha-1 | Decided by | fmm | fmm | 2026-10-07 | Ruling was the investigator's. |\n");
    const r = loadProject(dir, OPTS).decisions.find((d) => d.id === "R-2026-10-05-alpha-1");
    assert.deepEqual(r.decidedBy, ["fmm"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("counts by decider", () => {
  const counts = model().counts.byDecider;
  assert.deepEqual(counts, [
    { id: "claude", name: "Claude Code", count: 3 },
    { id: "fmm", name: "Fiona Miller", count: 2 },
  ]);
});

test("events sorted by time", () => {
  const times = model().events.map((e) => e.time);
  assert.deepEqual(times, ["2026-10-01T09:00Z", "2026-10-02T08:00Z", "2026-10-03T10:30:15Z"]);
});

test("documents in date order with kinds", () => {
  const docs = model().documents;
  assert.deepEqual(docs.map((d) => d.kind), ["design", "plan", "probes", "findings", "ledger", "readme", "calls"]);
  assert.equal(docs[0].title, "Alpha design");
  assert.equal(docs[0].status, "Approved");
  assert.equal(docs[0].path, "plans/2026-10-01-alpha-design.md");
  assert.equal(docs[1].status, null);
  assert.equal(docs[5].date, null);
});

test("calls summary", () => {
  const { budgets, services } = model().calls;
  assert.equal(budgets.length, 1);
  const jev = services.find((s) => s.service === "jev");
  assert.equal(jev.calls, 2);
  assert.equal(jev.costUsd, 0.003);
  assert.equal(jev.maxCalls, 40);
  assert.equal(jev.maxCostUsd, 0.01);
});

test("build info and config", () => {
  const m = model();
  assert.deepEqual(m.build, { sha: "abc1234", date: "2026-10-19" });
  assert.equal(m.config.project, "Fixture project");
  assert.deepEqual(m.config.theme, {});
});

test("missing column gives file and line", () => {
  assert.throws(() => loadProject("tests/fixtures/bad-column", OPTS),
    /project\/decisions\.md:\d+: table "Decisions" lacks column\(s\) How/);
});

test("newer format_version asks for the update procedure", () => {
  const dir = tempCopy();
  try {
    const p = join(dir, ".replication/site.config.json");
    writeFileSync(p, JSON.stringify({ ...JSON.parse(readFileSync(p, "utf8")), format_version: 2 }));
    assert.throws(() => loadProject(dir, OPTS), /Run the update procedure/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("missing config file is a record format error", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-project-"));
  try {
    assert.throws(() => loadProject(dir, OPTS), /\.replication\/site\.config\.json:1: file not found/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("missing plan file throws", () => {
  const dir = tempCopy();
  try {
    rmSync(join(dir, "replication_materials/plans/2026-10-02-alpha-plan.md"));
    assert.throws(() => loadProject(dir, OPTS), /roadmap\.md:\d+: .*2026-10-02-alpha-plan\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a milestone state outside the list is rejected", () => {
  const dir = tempCopy();
  try {
    const p = join(dir, "replication_materials/project/roadmap.md");
    writeFileSync(p, readFileSync(p, "utf8").replace("| M3 | Write the paper | next", "| M3 | Write the paper | soon"));
    assert.throws(() => loadProject(dir, OPTS), /roadmap\.md:\d+: State "soon" is not allowed\. Use one of: done, now/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("parseCsv handles quotes, commas and CRLF", () => {
  const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n1,2\r\n');
  assert.deepEqual(rows, [{ a: "x, y", b: 'say "hi"' }, { a: "1", b: "2" }]);
});
