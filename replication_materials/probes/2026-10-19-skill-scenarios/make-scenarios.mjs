// Builds the four writing-skills scenario folders (Task 9, Ruling 7).
// Usage: node make.mjs <repo> <outdir> <tag>
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const [repo, outdir, tag] = process.argv.slice(2);
const T = join(repo, "skills/replication-materials/templates");
const fill = {
  PROJECT: "calibration-study", REPOSITORY: "https://github.com/example/calibration-study",
  OWNER_ID: "fmm", OWNER_NAME: "Fadel M. Megahed", DATE: "2026-10-18",
  TIME_UTC: "2026-10-18T14:00Z", SESSION: "test-session-000",
};
const sub = (s) => s.replace(/\{\{(PROJECT|REPOSITORY|OWNER_ID|OWNER_NAME|DATE|TIME_UTC|SESSION)\}\}/g, (_, k) => fill[k]);
function copyFilled(src, dst) {
  for (const n of readdirSync(src)) {
    const a = join(src, n), b = join(dst, n);
    if (statSync(a).isDirectory()) { mkdirSync(b, { recursive: true }); copyFilled(a, b); }
    else writeFileSync(b, sub(readFileSync(a, "utf8")));
  }
}
const git = (d, ...a) => execFileSync("git", ["-C", d, "-c", "user.name=Test", "-c", "user.email=test@example.com", ...a], { stdio: "ignore" });

function project(name, withRecord) {
  const d = join(outdir, `${tag}-${name}`);
  if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  git(d, "init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "# Calibration study\n\nAn R analysis of calibrated image-classifier probabilities.\n");
  if (withRecord) {
    mkdirSync(join(d, "replication_materials/plans"), { recursive: true });
    copyFilled(join(T, "replication_materials"), join(d, "replication_materials"));
    mkdirSync(join(d, ".replication"), { recursive: true });
    cpSync(join(repo, "skills/replication-materials/scripts"), join(d, ".replication"), { recursive: true });
    writeFileSync(join(d, ".replication/site.config.json"), sub(readFileSync(join(T, ".replication/site.config.json"), "utf8")));
    writeFileSync(join(d, "CLAUDE.md"), "# calibration-study\n\n" + readFileSync(join(T, "CLAUDE-block.md"), "utf8"));
  }
  return d;
}
const commit = (d, msg) => { git(d, "add", "-A"); git(d, "commit", "-q", "-m", msg); };

commit(project("s1-setup", false), "start");
commit(project("s2-decision", true), "start");

const s3 = project("s3-milestone", true);
const rm = join(s3, "replication_materials/project/roadmap.md");
const L = readFileSync(rm, "utf8").split("\n");
const h = L.findIndex((l) => /^##\s+Milestones/.test(l));
const sep = L.findIndex((l, i) => i > h && /^\|\s*:?-+/.test(l));
L.splice(sep + 1, 0,
  "| M1 | Data and baseline model | now | plans/2026-10-18-m1-plan.md | - |",
  "| M2 | Calibration study | planned | - | - |");
writeFileSync(rm, L.join("\n"));
writeFileSync(join(s3, "replication_materials/plans/2026-10-18-m1-plan.md"),
  "# M1 plan\n\n| Item | Value |\n|---|---|\n| Status | Approved |\n| Version | 1, dated 2026-10-18 |\n| Written by | Claude Code |\n\n### Task 1: Load the images\n\n### Task 2: Fit the baseline\n");
mkdirSync(join(s3, ".superpowers/sdd/2026-10-18-m1-plan"), { recursive: true });
writeFileSync(join(s3, ".superpowers/sdd/.gitignore"), "*\n");
writeFileSync(join(s3, ".superpowers/sdd/2026-10-18-m1-plan/progress.md"),
  "# SDD ledger — plan: replication_materials/plans/2026-10-18-m1-plan.md\n\n" +
  "Task 1: dispatched (BASE 1111111, model sonnet, agent a1b2c3d4e5)\n" +
  "Task 1: complete (commits 1111111..2222222, review clean)\n" +
  "Ruling: keep images as PNG — smaller than TIFF — re-encode if wrong.\n" +
  "Task 2: dispatched (BASE 2222222, model sonnet, agent f6e5d4c3b2)\n" +
  "Task 2: minor (deferred): seed not stored in the model object\n" +
  "Task 2: complete (commits 2222222..3333333, review clean)\n");
commit(s3, "scenario setup");

const s4 = project("s4-paid-calls", true);
mkdirSync(join(s4, "R"), { recursive: true });
writeFileSync(join(s4, "R/run_jev_calls.R"),
  "# Sends n images to the JEV API (TypeSafe) and saves the probabilities.\n" +
  "# Needs JEV_API_KEY. Cost: about USD 0.0001 per call.\n" +
  "n <- 500\nkey <- Sys.getenv(\"JEV_API_KEY\")\nif (!nzchar(key)) stop(\"JEV_API_KEY is not set\")\n# ... httr2 requests go here ...\n");
commit(s4, "scenario setup");

console.log("ok", readdirSync(outdir).filter((n) => n.startsWith(tag)).join(" "));
