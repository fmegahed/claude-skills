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

test("topics and checks come from the fixture", () => {
  const m = model();
  assert.deepEqual(m.topics.map((t) => t.topic), ["prompts", "data"]);
  const by = Object.fromEntries(m.decisions.map((d) => [d.id, d]));
  assert.equal(by.D1.checked, false);
  assert.equal(by.D2.checked, true);
  assert.deepEqual(by.D2.checks, [{ by: "Fiona Miller", byId: "fmm", date: "2026-10-06", note: "Checked against the call log." }]);
  assert.equal(by.D3.topic, "prompts");
  assert.deepEqual(by.D3.replaces, ["D1", "D2"]);
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
  assert.deepEqual(docs.map((d) => d.kind), ["design", "plan", "probes", "findings", "ledger", "readme", "calls", "contributions"]);
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

// Writes a project from the fixture, changes one file, and returns loadProject or its error.
function withChange(rel, change, fn) {
  const dir = tempCopy();
  try {
    const p = join(dir, rel);
    writeFileSync(p, change(readFileSync(p, "utf8")));
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const CSV = "replication_materials/calls/jev-calls.csv";

test("an empty cost_usd counts as 0", () => {
  const jev = withChange(CSV, (s) => s + "2026-10-03T10:02:00Z,c3,failed call,m1,r3,error,900,100,0,\n",
    (dir) => loadProject(dir, OPTS).calls.services.find((s) => s.service === "jev"));
  assert.equal(jev.calls, 3);
  assert.equal(jev.costUsd, 0.003);
});

test("a non-numeric cost_usd stops the build", () => {
  withChange(CSV, (s) => s + "2026-10-03T10:02:00Z,c3,bad call,m1,r3,ok,900,100,0,free\n",
    (dir) => assert.throws(() => loadProject(dir, OPTS), /calls\/jev-calls\.csv:4: cost_usd "free" is not a number/));
});

const BUDGETS = "replication_materials/calls/README.md";

// A budget row joins its log by name: Service "jev" is the log jev-calls.csv.
// A readable Service ("JEV API") left the log with no budget, and the Progress
// page showed two services (a fine_tuned_jev record, D111).
test("a call log that no budget row names stops the build", () => {
  withChange(BUDGETS, (s) => s.replace("| jev |", "| JEV API |"),
    (dir) => assert.throws(() => loadProject(dir, OPTS),
      /calls\/jev-calls\.csv:1: no budget row in calls\/README\.md has the Service "jev"/));
});

// Compatibility: a budget row of a service with no call log yet (any Service
// text) still builds, with 0 calls.
test("a budget row with no call log has no calls", () => {
  const row = "| 2026-10-04 | Open AI | Later probes | 10 | 1 | fmm |\n";
  const openai = withChange(BUDGETS, (s) => s.replace(/(\| 2026-10-03 \| jev .*\n)/, `$1${row}`),
    (dir) => loadProject(dir, OPTS).calls.services.find((s) => s.service === "Open AI"));
  assert.equal(openai.calls, 0);
  assert.equal(openai.maxCalls, 10);
});

test("site.config.json is checked at load", () => {
  const good = { project: "P", repository: "https://github.com/o/r", format_version: 1 };
  const cases = [
    [null, /must hold a JSON object/],
    [[], /must hold a JSON object/],
    [{ ...good, project: undefined }, /project must be a non-empty string/],
    [{ ...good, project: "" }, /project must be a non-empty string/],
    [{ ...good, project: null }, /project must be a non-empty string/],
    [{ ...good, repository: undefined }, /repository must look like https:\/\/github\.com\/\[owner\]\/\[repo\]/],
    [{ ...good, repository: null }, /repository must look like/],
    [{ ...good, repository: "https://gitlab.com/o/r" }, /repository must look like/],
    [{ ...good, repository: "https://github.com/o/r/" }, /repository must look like/],
    [{ ...good, repository: "javascript:alert(1)" }, /repository must look like/],
    [{ ...good, format_version: null }, /format_version must be a number/],
    [{ ...good, format_version: undefined }, /format_version must be a number/],
    [{ ...good, theme: null }, /theme must be an object/],
    [{ ...good, theme: { accent: "#fff" } }, /theme value accent "#fff" must look like #RRGGBB/],
    [{ ...good, theme: { accent: "red; } body { display: none" } }, /theme value accent/],
    [{ ...good, theme: { accent: null } }, /theme value accent "null"/],
    [{ ...good, theme: { "x: red; } a {": "#000000" } }, /theme key "x: red; } a \{" is not a token/],
  ];
  for (const [config, re] of cases) {
    withChange(".replication/site.config.json", () => JSON.stringify(config), (dir) =>
      assert.throws(() => loadProject(dir, OPTS), (e) => e.name === "RecordFormatError"
        && e.message.startsWith(".replication/site.config.json:1: ") && re.test(e.message), JSON.stringify(config)));
  }
  withChange(".replication/site.config.json", () => JSON.stringify({ ...good, theme: { accent: "#00563F" } }),
    (dir) => assert.deepEqual(loadProject(dir, OPTS).config.theme, { accent: "#00563F" }));
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

// Extra pages: files of the project that the website publishes as they are.
function withPageFiles(files, config, fn) {
  const dir = tempCopy();
  try {
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(join(dir, rel, ".."), { recursive: true });
      writeFileSync(join(dir, rel), text);
    }
    const p = join(dir, ".replication/site.config.json");
    writeFileSync(p, JSON.stringify({ ...JSON.parse(readFileSync(p, "utf8")), ...config }));
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("extra pages default to none", () => {
  assert.deepEqual(model().config.pages, []);
});

test("an extra page gets a site path under pages/", () => {
  withPageFiles({ "analysis/report.html": "<p>x</p>" },
    { pages: [{ file: "analysis/report.html", title: "Analysis" }] },
    (dir) => assert.deepEqual(loadProject(dir, OPTS).config.pages,
      [{ file: "analysis/report.html", title: "Analysis", path: "pages/report.html" }]));
});

test("extra pages are checked at load", () => {
  const files = { "report.html": "x", "a/same.html": "x", "b/same.html": "x", "folder/keep.txt": "" };
  const cases = [
    [{}, /pages must be a list/],
    [[null], /pages\[0\] must be an object with file and title/],
    [[{ file: "report.html" }], /pages\[0\]\.title must be a non-empty string/],
    [[{ file: "", title: "R" }], /pages\[0\]\.file "" must be a relative path inside the project/],
    [[{ file: "../report.html", title: "R" }], /must be a relative path inside the project/],
    [[{ file: "/report.html", title: "R" }], /must be a relative path inside the project/],
    [[{ file: "C:\\report.html", title: "R" }], /must be a relative path inside the project/],
    [[{ file: "a\\..\\report.html", title: "R" }], /must be a relative path inside the project/],
    [[{ file: "missing.html", title: "R" }], /pages\[0\]\.file "missing.html" is not a file/],
    [[{ file: "folder", title: "R" }], /pages\[0\]\.file "folder" is not a file/],
    [[{ file: "a/same.html", title: "A" }, { file: "b/same.html", title: "B" }],
      /pages\[1\]\.file has the same file name as pages\[0\]\.file/],
  ];
  for (const [pages, re] of cases) {
    withPageFiles(files, { pages }, (dir) =>
      assert.throws(() => loadProject(dir, OPTS), (e) => e.name === "RecordFormatError"
        && e.message.startsWith(".replication/site.config.json:1: ") && re.test(e.message), JSON.stringify(pages)));
  }
});

test("documents carry milestone and size", () => {
  const byPath = Object.fromEntries(model().documents.map((d) => [d.path, d]));
  const plan = byPath["plans/2026-10-02-alpha-plan.md"];
  const ledger = byPath["plans/2026-10-05-alpha-ledger.md"];
  assert.equal(plan.milestone, "M2");
  assert.equal(plan.size, "3 tasks");
  assert.equal(ledger.milestone, "M2");
  assert.equal(ledger.size, "2 tasks complete; 2 rulings");
  assert.equal(byPath["plans/2026-10-01-alpha-design.md"].milestone, null);
  assert.equal(byPath["plans/2026-10-01-alpha-design.md"].size, null);
});

test("documents keep Written by and Approved by of their Item/Value table (I5)", () => {
  const byPath = Object.fromEntries(model().documents.map((d) => [d.path, d]));
  const account = byPath["project/contributions.md"];
  assert.equal(account.status, "Draft");
  assert.equal(account.writtenBy, "Claude Code (draft)");
  assert.equal(account.approvedBy, "-");
  assert.equal(byPath["plans/2026-10-02-alpha-plan.md"].writtenBy, null);
  assert.equal(byPath["plans/2026-10-02-alpha-plan.md"].approvedBy, null);
});
