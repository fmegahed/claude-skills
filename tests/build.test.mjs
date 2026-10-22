import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

const SCRIPT = "skills/replication-materials/scripts/build-site.mjs";
const run = (root, out) => spawnSync("node", [SCRIPT, "--root", root, "--out", out],
  { encoding: "utf8", env: { ...process.env, GIT_SHA: "abc1234" } });
const tmp = () => mkdtempSync(join(tmpdir(), "rm-build-"));

test("builds the fixture and reports pages", () => {
  const out = join(tmp(), "site");
  const r = run("tests/fixtures/full", out);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Wrote \d+ pages to /);
  assert.ok(existsSync(join(out, "index.html")));
});

test("bad column exits 1 with file and line", () => {
  const r = run("tests/fixtures/bad-column", join(tmp(), "site"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /replication-materials: project\/decisions\.md:\d+: table "Decisions" lacks column\(s\) How/);
});

test("refuses a non-empty folder that is not a site", () => {
  const out = tmp();
  writeFileSync(join(out, "keep.txt"), "x");
  const r = run("tests/fixtures/full", out);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /is not empty and is not a previous site\./);
  assert.ok(existsSync(join(out, "keep.txt")));
});

test("rebuild over a previous site works", () => {
  const out = join(tmp(), "site");
  assert.equal(run("tests/fixtures/full", out).status, 0);
  assert.equal(run("tests/fixtures/full", out).status, 0);
});

test("rebuild over a site of an older skill version works", () => {
  const out = tmp();
  writeFileSync(join(out, "index.html"), '<meta name="generator" content="replication-materials 1.0.0">');
  assert.equal(run("tests/fixtures/full", out).status, 0);
});

test("copies extra pages byte for byte and links them", () => {
  const root = mkdtempSync(join(tmpdir(), "rm-build-root-"));
  cpSync("tests/fixtures/full", root, { recursive: true });
  mkdirSync(join(root, "analysis"));
  const bytes = Buffer.from([0x3c, 0x70, 0x3e, 0xe2, 0x9c, 0x93, 0x00, 0xff]);
  writeFileSync(join(root, "analysis/report.html"), bytes);
  const config = join(root, ".replication/site.config.json");
  writeFileSync(config, JSON.stringify({
    ...JSON.parse(readFileSync(config, "utf8")),
    pages: [{ file: "analysis/report.html", title: "Analysis" }],
  }));
  const out = join(tmp(), "site");
  const r = run(root, out);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(readFileSync(join(out, "pages/report.html")), bytes);
  assert.match(readFileSync(join(out, "index.html"), "utf8"), /href="pages\/report\.html"/);
  assert.match(r.stdout, /and 1 extra page/);
});

test("an empty --out is refused and leaves the folder alone", () => {
  const cwd = tmp();
  writeFileSync(join(cwd, "index.html"), "mine");
  const r = spawnSync("node", [join(process.cwd(), SCRIPT), "--root", join(process.cwd(), "tests/fixtures/full"), "--out", ""],
    { encoding: "utf8", cwd });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /replication-materials: --out needs a folder name\./);
  assert.equal(readFileSync(join(cwd, "index.html"), "utf8"), "mine");
});

test("every page names generator replication-materials 1.2.1", () => {
  const out = join(tmp(), "site");
  const r = run("tests/fixtures/full", out);
  assert.equal(r.status, 0, r.stderr);
  // Every page that the build writes, the new pages of 1.2.0 too (M10).
  const pages = readdirSync(out, { recursive: true }).map((p) => p.split(sep).join("/")).filter((p) => p.endsWith(".html"));
  assert.equal(pages.length, Number(r.stdout.match(/^Wrote (\d+) pages/)[1]));
  for (const page of ["timeline/index.html", "contributions/index.html", "releases/index.html", "results/index.html",
    "docs/project/contributions/index.html"]) {
    assert.ok(pages.includes(page), page);
  }
  for (const page of pages) {
    assert.match(readFileSync(join(out, page), "utf8"), /<meta name="generator" content="replication-materials 1\.2\.1">/, page);
  }
});
