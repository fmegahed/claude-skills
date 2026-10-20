import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { spawnSync } from "node:child_process";

const SKILL = "skills/replication-materials";
const TEMPLATES = join(SKILL, "templates");
const read = (p) => readFileSync(join(TEMPLATES, p), "utf8");

const VALUES = {
  PROJECT: "Template project",
  REPOSITORY: "https://github.com/example/template",
  OWNER_ID: "abc",
  OWNER_NAME: "Alex Example",
  DATE: "2026-10-19",
  TIME_UTC: "2026-10-19T12:00Z",
  SESSION: "session-1234",
};
const fill = (s) => s.replace(/\{\{(PROJECT|REPOSITORY|OWNER_ID|OWNER_NAME|DATE|TIME_UTC|SESSION)\}\}/g, (_, k) => VALUES[k]);

function allFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? allFiles(p) : [p];
  });
}

test("templates build to a site", () => {
  const root = mkdtempSync(join(tmpdir(), "rm-templates-"));
  for (const f of allFiles(TEMPLATES)) {
    const rel = f.slice(TEMPLATES.length + 1).split(sep).join("/");
    if (!/^(replication_materials|\.replication)\//.test(rel)) continue;
    const dest = join(root, rel);
    mkdirSync(join(dest, ".."), { recursive: true });
    writeFileSync(dest, fill(readFileSync(f, "utf8")));
  }
  cpSync(join(SKILL, "scripts"), join(root, ".replication"), { recursive: true });
  const out = join(root, "_site");
  const r = spawnSync(process.execPath, [join(SKILL, "scripts/build-site.mjs"), "--root", root, "--out", out], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(readFileSync(join(out, "decisions/index.html"), "utf8"), /D1/);
  assert.match(readFileSync(join(out, "process/index.html"), "utf8"), /inputs/);
  const records = readFileSync(join(out, "records/index.html"), "utf8");
  assert.match(records, /docs\/README\/index\.html/);
  assert.match(records, /docs\/calls\/README\/index\.html/);
});

test("workflow pins every action to a SHA", () => {
  const uses = read(".github/workflows/replication-site.yml").split("\n").filter((l) => /^\s*-?\s*uses:/.test(l));
  assert.equal(uses.length, 5);
  for (const l of uses) assert.match(l, /@[0-9a-f]{40} # v\d/);
});

test("workflow gives each job only its permissions", () => {
  const y = read(".github/workflows/replication-site.yml");
  assert.match(y, /^# replication-materials 1\.0\.0\n/);
  assert.match(y, /^permissions: \{\}$/m);
  assert.match(y, /pages:\s*\n(?:.*\n)*?\s+permissions:\s*\n\s+pages: write\n\s+id-token: write/);
  assert.doesNotMatch(y, /^  artifact:/m);
  assert.match(y, /node \.replication\/build-site\.mjs --out _site/);
});

test("CLAUDE block has both markers and the D15 rule", () => {
  const b = read("CLAUDE-block.md");
  assert.match(b, /^<!-- replication-materials:start -->$/m);
  assert.match(b, /^<!-- replication-materials:end -->$/m);
  assert.match(b, /without asking/);
  assert.match(b, /replication_materials\//);
});

test("templates contain no key-like text", () => {
  for (const f of allFiles(TEMPLATES)) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /(sk-|ghp_|gho_|api[_-]?key\s*=)/i, f);
  }
});

test("only the seven known placeholders appear", () => {
  for (const f of allFiles(TEMPLATES)) {
    const s = readFileSync(f, "utf8").replace(/\$\{\{[^}]*\}\}/g, "");
    for (const m of s.matchAll(/\{\{(\w+)\}\}/g)) {
      assert.ok([...Object.keys(VALUES), "PLAN_PATH"].includes(m[1]), `${f}: ${m[0]}`);
    }
  }
});
