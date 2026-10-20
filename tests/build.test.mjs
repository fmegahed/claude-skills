import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
