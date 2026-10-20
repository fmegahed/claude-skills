import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadProject } from "../skills/replication-materials/scripts/lib/project.mjs";

const SKILL_SCRIPTS = "skills/replication-materials/scripts";

function allFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? allFiles(p) : [p];
  });
}

test("the repository record builds", () => {
  const project = loadProject(".");
  const ids = project.decisions.map((d) => d.id);
  assert.ok(project.decisions.length >= 21);
  assert.ok(ids.includes("D1"));
  assert.ok(ids.includes("D21"));
});

test("the repository copy of the build script equals the skill copy", () => {
  const files = allFiles(".replication").filter((p) => !p.endsWith("site.config.json"));
  assert.ok(files.length > 0);
  for (const p of files) {
    const rel = p.slice(".replication/".length);
    assert.deepEqual(readFileSync(p), readFileSync(join(SKILL_SCRIPTS, rel)), p);
  }
});
