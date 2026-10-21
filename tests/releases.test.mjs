import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readReleases, readResults, checkReleaseResults } from "../skills/replication-materials/scripts/lib/releases.mjs";
import { loadProject } from "../skills/replication-materials/scripts/lib/project.mjs";

const OPTS = { gitSha: "abc1234", buildDate: "2026-10-19" };
const IDS = ["D1", "D2", "D3", "D5", "R-2026-10-05-alpha-1"];
const RHEAD = "## Releases\n\n| Tag | Date | Commit | Summary | Decisions | Results |\n|---|---|---|---|---|---|\n";
const SHEAD = "## Results\n\n| ID | Release | Result | Value | Source | Decisions | Replaces |\n|---|---|---|---|---|---|---|\n";
const table = (head, rows) => head + rows.map((r) => `| ${r.join(" | ")} |`).join("\n") + "\n";
const rel = (...rows) => table(RHEAD, rows);
const res = (...rows) => table(SHEAD, rows);
const okRel = ["v1.0.0", "2026-10-05", "abc1234", "Text.", "-", "-"];
const okRes = ["H1", "-", "Mean", "1.5", "data/summary.csv", "-", "-"];
const opts = { root: "tests/fixtures/full", releaseTags: ["v1.0.0"], decisionIds: IDS };

test("reads a release and splits date and time", () => {
  const [r] = readReleases(rel(["v1.2.3-rc.1", "2026-10-12T14:30Z", "abc1234", "Text.", "D1", "-"]), "project/releases.md", IDS);
  assert.deepEqual(r, {
    tag: "v1.2.3-rc.1", date: "2026-10-12", time: "14:30", commit: "abc1234", summary: "Text.",
    decisionIds: ["D1"], resultIds: [], line: 5,
  });
});

test("a range gives the existing decision IDs in it", () => {
  const [r] = readReleases(rel(["v1.0.0", "2026-10-05", "abc1234", "T.", "D1 to D5", "-"]), "f", IDS);
  assert.deepEqual(r.decisionIds, ["D1", "D2", "D3", "D5"]);
});

for (const [name, row, pattern] of [
  ["bad tag", ["1.0", "2026-10-05", "abc1234", "T.", "-", "-"], /f:5: Tag "1\.0" must look like v1\.2\.3/],
  ["bad date", ["v1.0.0", "05/10/2026", "abc1234", "T.", "-", "-"], /f:5: Date "05\/10\/2026" must look like/],
  ["bad commit", ["v1.0.0", "2026-10-05", "xyz", "T.", "-", "-"], /f:5: Commit "xyz" must be/],
  ["unknown decision", ["v1.0.0", "2026-10-05", "abc1234", "T.", "D9", "-"], /f:5: unknown decision "D9"/],
  ["range end missing", ["v1.0.0", "2026-10-05", "abc1234", "T.", "D1 to D9", "-"], /f:5: unknown decision "D9"/],
  ["bad decision text", ["v1.0.0", "2026-10-05", "abc1234", "T.", "all", "-"], /f:5: Decisions "all" must be/],
]) {
  test(`release error: ${name}`, () => assert.throws(() => readReleases(rel(row), "f", IDS), pattern));
}

test("release tags must be unique", () => {
  assert.throws(() => readReleases(rel(okRel, okRel), "f", IDS), /f:6: duplicate tag "v1\.0\.0"/);
});

test("reads a result", () => {
  const [r] = readResults(res(["H2", "v1.0.0", "Mean", "1.7", "data/summary.csv#a", "D1, D2", "-"]), "project/results.md", opts);
  assert.deepEqual(r, {
    id: "H2", release: "v1.0.0", result: "Mean", value: "1.7", source: "data/summary.csv#a",
    decisionIds: ["D1", "D2"], replaces: [], line: 5,
  });
});

test("results are in ID number order and Release - means not released", () => {
  const rows = readResults(res(
    ["H10", "-", "B", "2", "data/summary.csv", "-", "-"], ["H2", "-", "A", "1", "data/summary.csv", "-", "-"]), "f", opts);
  assert.deepEqual(rows.map((r) => [r.id, r.release]), [["H2", null], ["H10", null]]);
});

for (const [name, row, pattern] of [
  ["bad ID", ["X1", "-", "A", "1", "data/summary.csv", "-", "-"], /f:5: ID "X1" must look like H1/],
  ["unknown release", ["H1", "v9.9.9", "A", "1", "data/summary.csv", "-", "-"], /f:5: Release "v9\.9\.9" is not a tag in releases\.md/],
  ["missing source", ["H1", "-", "A", "1", "x", "-", "-"], /f:5: Source "x" is not a file in the repository\./],
  ["source outside", ["H1", "-", "A", "1", "../x", "-", "-"], /f:5: Source "\.\.\/x" is not a file in the repository\./],
  ["backslash source", ["H1", "-", "A", "1", "data\\summary.csv", "-", "-"], /f:5: Source "data\\summary\.csv" is not a file in the repository\./],
  ["unknown decision", ["H1", "-", "A", "1", "data/summary.csv", "D9", "-"], /f:5: unknown decision "D9"/],
  ["unknown replaces", ["H1", "-", "A", "1", "data/summary.csv", "-", "H7"], /f:5: unknown result "H7"/],
]) {
  test(`result error: ${name}`, () => assert.throws(() => readResults(res(row), "f", opts), pattern));
}

test("Replaces names an earlier result only", () => {
  assert.throws(() => readResults(res(
    ["H1", "-", "A", "1", "data/summary.csv", "-", "H2"], ["H2", "-", "B", "1", "data/summary.csv", "-", "-"]), "f", opts),
  /f:5: H1 cannot replace a later result H2/);
});

test("result IDs must be unique", () => {
  assert.throws(() => readResults(res(okRes, okRes), "f", opts), /f:6: duplicate result ID "H1"/);
});

test("a release Results cell must name results that exist", () => {
  const releases = readReleases(rel(["v1.0.0", "2026-10-05", "abc1234", "T.", "-", "H1, H5"]), "project/releases.md", IDS);
  const results = readResults(res(["H1", "v1.0.0", "Mean", "1.5", "data/summary.csv", "-", "-"]), "project/results.md", opts);
  assert.deepEqual(releases[0].resultIds, ["H1", "H5"]);
  assert.throws(() => checkReleaseResults(releases, results, "project/releases.md"),
    /project\/releases\.md:5: unknown result "H5"/);
});

test("a release lists only results that belong to it", () => {
  const releases = readReleases(rel(["v1.0.0", "2026-10-05", "abc1234", "T.", "-", "H1"]), "project/releases.md", IDS);
  const other = readResults(res(["H1", "v2.0.0", "Mean", "1", "data/summary.csv", "-", "-"]), "f", { ...opts, releaseTags: ["v1.0.0", "v2.0.0"] });
  assert.throws(() => checkReleaseResults(releases, other, "project/releases.md"),
    /project\/releases\.md:5: Results lists H1, but H1 belongs to release v2\.0\.0\./);
  const none = readResults(res(okRes), "f", opts);
  assert.throws(() => checkReleaseResults(releases, none, "project/releases.md"),
    /project\/releases\.md:5: Results lists H1, but H1 has no release\./);
});

function tempCopy() {
  const dir = mkdtempSync(join(tmpdir(), "rel-"));
  cpSync("tests/fixtures/full", dir, { recursive: true });
  return dir;
}

test("the fixture loads releases newest first and results in ID order", () => {
  const m = loadProject("tests/fixtures/full", OPTS);
  assert.deepEqual(m.releases.map((r) => r.tag), ["v0.2.0", "v0.1.0"]);
  assert.deepEqual(m.releases[0].decisionIds, ["D1", "D2", "D3"]);
  assert.deepEqual(m.results.map((r) => r.id), ["H1", "H2", "H3"]);
  assert.deepEqual(m.results[1].replaces, ["H1"]);
});

test("a project with neither file gives empty lists", () => {
  const dir = tempCopy();
  try {
    rmSync(join(dir, "replication_materials/project/releases.md"));
    rmSync(join(dir, "replication_materials/project/results.md"));
    const m = loadProject(dir, OPTS);
    assert.deepEqual([m.releases, m.results], [[], []]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a results file alone loads, and a bad Release is reported with its file", () => {
  const dir = tempCopy();
  try {
    rmSync(join(dir, "replication_materials/project/releases.md"));
    assert.throws(() => loadProject(dir, OPTS), /project\/results\.md:7: Release "v0\.1\.0" is not a tag in releases\.md/);
    const p = join(dir, "replication_materials/project/results.md");
    writeFileSync(p, readFileSync(p, "utf8").replaceAll("v0.1.0", "-").replaceAll("v0.2.0", "-"));
    assert.equal(loadProject(dir, OPTS).results.length, 3);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
