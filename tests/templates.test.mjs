import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
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

const OPTIONAL = ["releases", "results", "contributions"];

// Does what set-up step 4 does: copies templates/replication_materials/, the config and the
// scripts. With optional, it also copies templates/optional/project/ as a project does later.
function setUp({ optional = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "rm-templates-"));
  for (const f of allFiles(TEMPLATES)) {
    const rel = f.slice(TEMPLATES.length + 1).split(sep).join("/");
    const to = /^(replication_materials|\.replication)\//.test(rel) ? rel
      : optional && rel.startsWith("optional/project/") ? `replication_materials/${rel.slice("optional/".length)}` : null;
    if (!to) continue;
    const dest = join(root, to);
    mkdirSync(join(dest, ".."), { recursive: true });
    writeFileSync(dest, fill(readFileSync(f, "utf8")));
  }
  cpSync(join(SKILL, "scripts"), join(root, ".replication"), { recursive: true });
  const out = join(root, "_site");
  const r = spawnSync(process.execPath, [join(SKILL, "scripts/build-site.mjs"), "--root", root, "--out", out], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  return out;
}

test("templates build to a site", () => {
  const out = setUp();
  assert.match(readFileSync(join(out, "decisions/index.html"), "utf8"), /D1/);
  assert.match(readFileSync(join(out, "process/index.html"), "utf8"), /inputs/);
  const records = readFileSync(join(out, "records/index.html"), "utf8");
  assert.match(records, /docs\/README\/index\.html/);
  assert.match(records, /docs\/calls\/README\/index\.html/);
  for (const page of ["timeline", "contributions"]) {
    assert.ok(existsSync(join(out, page, "index.html")), page);
  }
  assert.match(readFileSync(join(out, "index.html"), "utf8"), /replication-materials 1\.2\.0/);
});

test("set-up does not copy the optional templates (M2)", () => {
  for (const f of OPTIONAL) {
    assert.ok(!existsSync(join(TEMPLATES, `replication_materials/project/${f}.md`)), `${f} is not a set-up template`);
    assert.ok(existsSync(join(TEMPLATES, `optional/project/${f}.md`)), f);
  }
  const out = setUp();
  for (const page of ["releases/index.html", "results/index.html", "docs/project/contributions/index.html"]) {
    assert.ok(!existsSync(join(out, page)), page);
  }
});

test("the optional templates parse and build (M2)", () => {
  const out = setUp({ optional: true });
  for (const page of ["releases/index.html", "results/index.html", "docs/project/contributions/index.html"]) {
    assert.ok(existsSync(join(out, page)), page);
  }
  assert.match(readFileSync(join(out, "releases/index.html"), "utf8"), /No releases yet\./);
  assert.match(readFileSync(join(out, "results/index.html"), "utf8"), /No results yet\./);
  assert.match(readFileSync(join(out, "contributions/index.html"), "utf8"), /Status: draft\. Written by: -\. Approved by: -\./);
});

test("the new templates hold no fill-in marker and the new tables", () => {
  for (const f of OPTIONAL) {
    assert.doesNotMatch(read(`optional/project/${f}.md`), /\[[^\]]+\]([^(]|$)/, f);
  }
  const d = read("replication_materials/project/decisions.md");
  assert.match(d, /\| Source \| Time \(UTC\) \| Topic \| Impact \| Replaces \|/);
  assert.match(d, /^## Topics$/m);
  assert.match(d, /^## Checks$/m);
});

test("workflow pins every action to a SHA", () => {
  const uses = read(".github/workflows/replication-site.yml").split("\n").filter((l) => /^\s*-?\s*uses:/.test(l));
  assert.equal(uses.length, 5);
  for (const l of uses) assert.match(l, /@[0-9a-f]{40} # v\d/);
});

test("workflow gives each job only its permissions", () => {
  const y = read(".github/workflows/replication-site.yml");
  assert.match(y, /^# replication-materials 1\.2\.0\n/);
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

test("CLAUDE block says to copy the ledger before the workspace is deleted", () => {
  // superpowers deletes .superpowers/sdd/<plan>/ right after the final review.
  assert.match(read("CLAUDE-block.md"),
    /^- Before you delete `\.superpowers\/sdd\/<plan>\/`, copy its ledger with the end-of-milestone procedure\.$/m);
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

test("workflow runs on each push to main, so a changed extra page rebuilds the site", () => {
  const y = read(".github/workflows/replication-site.yml");
  assert.match(y, /^ {2}push:\n {4}branches: \[main\]\n/m);
  assert.doesNotMatch(y, /^\s+paths:/m);
});

test("the version lines of the build script, the pages and the workflow agree", async () => {
  const { VERSION } = await import("../skills/replication-materials/scripts/lib/html.mjs");
  const build = readFileSync(join(SKILL, "scripts/build-site.mjs"), "utf8");
  assert.equal(build.split("\n")[0], `// replication-materials ${VERSION}`);
  assert.equal(read(".github/workflows/replication-site.yml").split("\n")[0], `# replication-materials ${VERSION}`);
});

test("workflow keeps workflow_dispatch so Claude Code can start the first run", () => {
  assert.match(read(".github/workflows/replication-site.yml"), /^\s{2}workflow_dispatch:/m);
});
