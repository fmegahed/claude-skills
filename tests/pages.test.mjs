import { test } from "node:test";
import assert from "node:assert/strict";
import { loadProject } from "../skills/replication-materials/scripts/lib/project.mjs";
import { renderSite } from "../skills/replication-materials/scripts/lib/pages.mjs";

const OPTS = { gitSha: "abc1234", buildDate: "2026-10-19" };
const model = () => loadProject("tests/fixtures/full", OPTS);
const site = () => renderSite(model());

test("renderSite makes the six kinds of page", () => {
  const s = site();
  for (const p of ["index.html", "records/index.html", "decisions/index.html", "progress/index.html",
    "process/index.html", "docs/plans/2026-10-01-alpha-design/index.html"]) {
    assert.ok(s.has(p), p);
  }
});

test("no root-absolute links in any page", () => {
  for (const [path, html] of site()) assert.doesNotMatch(html, /(href|src)="\//, path);
});

test("script text in a decision is escaped", () => {
  const html = site().get("decisions/index.html");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(1)"));
});

test("escaped pipe shows as a pipe", () => {
  assert.ok(site().get("decisions/index.html").includes("| safely"));
});

test("decisions page has filters for decider and how", () => {
  const html = site().get("decisions/index.html");
  assert.match(html, /data-filter-key="decided" data-filter-value="fmm"/);
  assert.match(html, /data-filter-key="decided" data-filter-value="claude"/);
  assert.match(html, /data-filter-key="how" data-filter-value="ruling"/);
  assert.match(html, /<div data-filters hidden>/);
  assert.match(html, /<p data-filter-count aria-live="polite">/);
});

test("corrected decision says who checked it", () => {
  assert.ok(site().get("decisions/index.html").includes("Corrected by Fiona Miller, 2026-10-06."));
});

test("document page embeds markdown safely", () => {
  const html = site().get("docs/plans/2026-10-01-alpha-design/index.html");
  const m = html.match(/<script type="application\/json" id="doc-md">([\s\S]*?)<\/script>/);
  assert.ok(m);
  assert.ok(!m[1].includes("<"));
  assert.ok(html.includes("integrity=\"sha512-xeUh"));
  assert.ok(html.includes('<pre id="doc-fallback"'));
  JSON.parse(m[1]);
  const ctx = JSON.parse(html.match(/id="doc-ctx">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ctx.folder, "plans");
  assert.equal(ctx.pages["plans/2026-10-02-alpha-plan.md"], "../2026-10-02-alpha-plan/index.html");
  assert.equal(ctx.blobBase, "https://github.com/example/fixture/blob/main/replication_materials/");
});

test("document context gives the raw base for images", () => {
  const html = site().get("docs/plans/2026-10-01-alpha-design/index.html");
  const ctx = JSON.parse(html.match(/id="doc-ctx">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ctx.rawBase, "https://raw.githubusercontent.com/example/fixture/main/replication_materials/");
});

test("progress shows tasks and calls", () => {
  const html = site().get("progress/index.html");
  assert.ok(html.includes("2 of 3"));
  assert.ok(html.includes("jev"));
  assert.ok(html.includes("0.003"));
});

test("progress shows - for a plan without a ledger", () => {
  const m = model();
  const m3 = m.milestones.find((x) => x.id === "M3");
  Object.assign(m3, { plan: "plans/2026-10-02-alpha-plan.md", ledger: null, tasksTotal: 3, tasksDone: null });
  const row = renderSite(m).get("progress/index.html").match(/<tr><td>M3<\/td>.*<\/tr>/)[0];
  assert.ok(!row.includes("0 of 3"), row);
  assert.match(row, /<td>-<\/td><\/tr>$/);
});

test("every table is a focusable labelled region with caption", () => {
  for (const [path, html] of site()) {
    const tables = html.match(/<table/g)?.length ?? 0;
    assert.equal(html.match(/<div class="table-wrap" tabindex="0" role="region" aria-label="[^"]+">/g)?.length ?? 0, tables, path);
    assert.equal(html.match(/<caption>/g)?.length ?? 0, tables, path);
  }
});

test("one h1 and a unique title per page", () => {
  const titles = new Set();
  for (const [path, html] of site()) {
    assert.equal(html.match(/<h1[ >]/g).length, 1, path);
    const t = html.match(/<title>(.*)<\/title>/)[1];
    assert.ok(!titles.has(t), t);
    titles.add(t);
  }
});

test("empty record shows empty states", () => {
  const m = { ...model(), decisions: [], events: [], documents: [], milestones: [], openItems: [],
    status: { current: null, next: null }, calls: { budgets: [], services: [] }, counts: { byDecider: [] } };
  const s = renderSite(m);
  assert.ok(s.get("decisions/index.html").includes("No decisions yet."));
  assert.ok(s.get("process/index.html").includes("No events yet."));
  assert.ok(s.get("records/index.html").includes("No documents yet."));
  assert.ok(s.get("progress/index.html").includes("No milestones yet."));
  assert.ok(s.get("progress/index.html").includes("No open items."));
  assert.ok(s.get("progress/index.html").includes("No paid calls yet."));
});

test("markdown JSON cannot close the script tag", () => {
  const m = model();
  const doc = { ...m.documents[0], text: "# T\n\n</script><script>alert(1)</script>\n" };
  const key = `docs/${doc.path.replace(/\.md$/, "")}/index.html`;
  const html = renderSite({ ...m, documents: [doc] }).get(key);
  assert.ok(html.includes("\u003c/script"));
  assert.ok(!html.includes("</script><script>alert"));
});

test("server HTML of a document page has no rail class", () => {
  const html = site().get("docs/plans/2026-10-01-alpha-design/index.html").replace(/<(script|style)[^]*?<\/\1>/g, "");
  assert.ok(html.includes('class="doc-layout"'));
  assert.ok(!html.includes("has-rail"));
  assert.ok(!html.includes("doc-rail"));
});

const withPages = (title = "Analysis") => {
  const m = model();
  m.config.pages = [{ file: "analysis/report.html", title, path: "pages/report.html" }];
  return renderSite(m);
};

test("Home lists the pages under the two reader groups, in navigation order", () => {
  const home = withPages().get("index.html");
  const main = home.slice(home.indexOf('<main id="main">'));
  // Each page with its description as visible text, for screens with no hover.
  assert.match(main, /<h3>Record<\/h3>\s*<ul>\s*<li><a href="process\/index\.html">Process<\/a>: [^<]{10,}<\/li>\s*<li><a href="timeline\/index\.html">Timeline<\/a>: [^<]{10,}<\/li>/);
  assert.match(main, /<h3>Reuse<\/h3>\s*<ul>\s*<li><a href="pages\/report\.html">Analysis<\/a><\/li>\s*<li><a href="releases\/index\.html">Releases<\/a>: [^<]{10,}<\/li>\s*<li><a href="https:\/\/github\.com\/example\/fixture">Repository<\/a>: [^<]{10,}<\/li>\s*<\/ul>/);
});

test("extra pages are in the navigation of every page and on Home", () => {
  const s = withPages();
  const home = s.get("index.html");
  assert.equal(home.match(/<a href="pages\/report\.html">Analysis<\/a>/g).length, 2, "nav and Pages list");
  assert.match(s.get("decisions/index.html"), /<a href="\.\.\/pages\/report\.html">Analysis<\/a>/);
  assert.match(s.get("docs/plans/2026-10-01-alpha-design/index.html"),
    /<a href="\.\.\/\.\.\/\.\.\/pages\/report\.html">Analysis<\/a>/);
});

test("renderSite leaves the extra pages to the build, which copies them", () => {
  assert.ok(!withPages().has("pages/report.html"));
});

test("an extra page title is escaped", () => {
  const home = withPages("<b>x</b>").get("index.html");
  assert.ok(home.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(!home.includes("<b>x</b>"));
});

// Releases and Results pages
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const REPO = "https://github.com/example/fixture";
const navLabels = (html) => [...html.match(/<nav[^]*?<\/nav>/)[0].matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);

test("releases page lists releases newest first with links", () => {
  const html = site().get("releases/index.html");
  assert.ok(html.indexOf("<h2>v0.2.0</h2>") > 0);
  assert.ok(html.indexOf("<h2>v0.2.0</h2>") < html.indexOf("<h2>v0.1.0</h2>"));
  assert.ok(html.includes(`href="${REPO}/tree/v0.2.0"`));
  assert.ok(html.includes(`href="${REPO}/commit/0123456789abcdef0123456789abcdef01234567"`));
  assert.ok(html.includes(`href="${REPO}/compare/v0.1.0...v0.2.0"`));
  assert.ok(!html.includes("compare/v0.1.0...v0.1.0") && !html.includes("/compare/undefined"));
  assert.equal(html.match(/\/compare\//g).length, 1);
});

test("two releases on one date with no time: the later row is the newer release (I4)", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-tie-"));
  try {
    cpSync("tests/fixtures/full", dir, { recursive: true });
    writeFileSync(join(dir, "replication_materials/project/releases.md"), `## Releases

| Tag | Date | Commit | Summary | Decisions | Results |
|---|---|---|---|---|---|
| v0.1.0 | 2026-10-05 | abc1234 | First. | - | H1 |
| v0.2.0 | 2026-10-12 | abc1235 | Second. | - | H2 |
| v0.2.1 | 2026-10-12 | abc1236 | Third. | - | - |
`);
    const m = loadProject(dir, OPTS);
    assert.deepEqual(m.releases.map((r) => r.tag), ["v0.2.1", "v0.2.0", "v0.1.0"]);
    const html = renderSite(m).get("releases/index.html");
    assert.deepEqual([...html.matchAll(/\/compare\/([^"]+)"/g)].map((x) => x[1]), ["v0.2.0...v0.2.1", "v0.1.0...v0.2.0"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("releases page tables hold decisions and results of each release", () => {
  const html = site().get("releases/index.html");
  const second = html.slice(html.indexOf("<h2>v0.2.0</h2>"), html.indexOf("<h2>v0.1.0</h2>"));
  assert.ok(second.includes("Keep the short prompt"));
  assert.ok(second.includes("Mean score of group a, new data"));
  assert.ok(!second.includes("Mean score of group b"));
  assert.match(html, /<th scope="col">Proposed by<\/th>/);
});

test("results page has filters, status and source links", () => {
  const html = site().get("results/index.html");
  assert.match(html, /data-filter-key="release" data-filter-value="v0\.1\.0"/);
  assert.match(html, /data-filter-key="status" data-filter-value="Current"/);
  assert.ok(html.includes("Replaced by H2"));
  assert.ok(html.includes(`href="${REPO}/blob/v0.2.0/data/summary.csv#a"`));
  assert.ok(html.includes(`href="${REPO}/blob/main/data/summary.csv"`));
  assert.equal(html.match(/Replaced by/g).length, 1);
});

test("nav follows the work, with Results last on the record side and Releases before Repository", () => {
  const labels = navLabels(site().get("index.html"));
  assert.deepEqual(labels, ["Home", "Process", "Timeline", "Progress", "Decisions", "Contributions", "Records", "Results",
    "Releases", "Repository"]);
});

test("a record without the two files builds with no pages and no nav items", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-empty-"));
  try {
    cpSync("tests/fixtures/full", dir, { recursive: true });
    for (const f of ["releases", "results"]) rmSync(join(dir, "replication_materials/project", `${f}.md`));
    const s = renderSite(loadProject(dir, OPTS));
    assert.ok(!s.has("releases/index.html") && !s.has("results/index.html"));
    assert.deepEqual(navLabels(s.get("index.html")), ["Home", "Process", "Timeline", "Progress", "Decisions", "Contributions", "Records", "Repository"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("a file with no rows gives an empty page", () => {
  const m = { ...model(), releases: [], results: [] };
  const s = renderSite(m);
  assert.ok(s.get("releases/index.html").includes("No releases yet."));
  assert.ok(s.get("results/index.html").includes("No results yet."));
});

test("release and result text is escaped", () => {
  const m = model();
  m.releases[0].summary = "<img src=x>";
  m.results[0].result = "<b>r</b>";
  const s = renderSite(m);
  assert.ok(!s.get("releases/index.html").includes("<img src=x>"));
  assert.ok(!s.get("results/index.html").includes("<b>r</b>"));
});

// Timeline page
const h2s = (html) => [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
const day = (html, d) => {
  const i = html.indexOf(`<h2>${d}</h2>`);
  const j = html.indexOf("<h2>", i + 4);
  return html.slice(i, j < 0 ? undefined : j);
};

test("timeline has one h2 per date, newest first", () => {
  const dates = h2s(site().get("timeline/index.html")).filter((h) => /^\d{4}-/.test(h));
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(new Set(dates).size, dates.length);
  assert.ok(dates.includes("2026-10-12") && dates.includes("2026-10-03") && dates.includes("2026-10-01"));
});

test("timeline orders timed items, then untimed items", () => {
  const d = day(site().get("timeline/index.html"), "2026-10-03");
  const plan = d.indexOf("Wrote the plan.");
  const keep = d.indexOf("Keep the short prompt");
  assert.ok(plan > 0 && keep > plan);
  const rel = day(site().get("timeline/index.html"), "2026-10-12");
  assert.match(rel, /Tag/);
  assert.ok(rel.includes("v0.2.0"));
});

test("timeline shows a person's decision and counts the others in one line", () => {
  const html = site().get("timeline/index.html");
  assert.ok(day(html, "2026-10-01").includes("D1") && day(html, "2026-10-01").includes("Use the public corpus"));
  const d2 = day(html, "2026-10-02");
  assert.ok(!d2.includes("alert(1)"));
  assert.match(d2, /<a href="\.\.\/decisions\/index\.html">1 decision or ruling by Claude Code<\/a>/);
});

test("timeline stage table has bars that are hidden from assistive tech", () => {
  const html = site().get("timeline/index.html");
  for (const h of ["Stage", "Start", "End", "Events"]) assert.ok(html.includes(`<th scope="col">${h}</th>`), h);
  const bars = [...html.matchAll(/<div class="bar"[^>]*>/g)].map((m) => m[0]);
  assert.equal(bars.length, 3);
  for (const b of bars) {
    assert.match(b, /aria-hidden="true"/);
    assert.match(b, /width:\d+(\.\d+)?%/);
  }
});

test("timeline lists a decision decided by unknown and leaves it out of the Claude Code count (I3)", () => {
  const m = model();
  m.decisions.push({ ...m.decisions[1], id: "D9", text: "Pick the unknown path", proposedBy: ["claude"], decidedBy: ["unknown"] });
  const d = day(renderSite(m).get("timeline/index.html"), "2026-10-02");
  assert.ok(d.includes("<strong>D9</strong>: Pick the unknown path"), d);
  assert.ok(d.includes('<span class="note">Decided by Unknown.</span>'), d);
  assert.match(d, />1 decision or ruling by Claude Code</);
  assert.ok(!day(site().get("timeline/index.html"), "2026-10-01").includes("Decided by"), "a person decision has no decider note");
});

test("timeline says where the milestones are (M11)", () => {
  const NOTE = '<h1>Timeline</h1>\n<p class="note">Milestones are not on this page because they have no dates. '
    + 'See <a href="../progress/index.html">Progress</a>.</p>';
  assert.ok(site().get("timeline/index.html").includes(NOTE));
  assert.ok(renderSite({ ...model(), events: [], decisions: [], releases: [] }).get("timeline/index.html").includes(NOTE));
});

test("timeline empty state and escaping", () => {
  const empty = renderSite({ ...model(), events: [], decisions: [], releases: [] }).get("timeline/index.html");
  assert.ok(empty.includes("No events yet."));
  const m = model();
  m.events[0].what = "<img src=x>";
  assert.ok(!renderSite(m).get("timeline/index.html").includes("<img src=x>"));
});

const section = (html, h2) => html.match(new RegExp(`<h2>${h2}</h2>([^]*?)(?=<h2>|$)`))?.[1] ?? "";

test("contributions page has the grid of proposers and deciders without rulings", () => {
  const html = site().get("contributions/index.html");
  const grid = html.match(/<table>\s*<caption>Who proposed and who decided<\/caption>[^]*?<\/table>/)[0];
  assert.match(grid, /<th scope="col">Fiona Miller<\/th>/);
  assert.match(grid, /<th scope="row">Claude Code<\/th>/);
  assert.ok(!grid.includes("R-2026"));
  assert.match(html, /2 rulings by Claude Code are not in the grid/);
});

test("contributions page lists what the researchers proposed with evidence", () => {
  const m = model();
  m.decisions[2].evidence = "findings/2026-10-04-alpha-findings.md";
  const part = section(renderSite(m).get("contributions/index.html"), "Proposed by the researchers");
  assert.match(part, /D1/);
  assert.match(part, /D3/);
  assert.ok(part.includes("2026-10-03 21:05"));
  assert.ok(!part.includes("D2"));
  assert.ok(part.includes("findings/2026-10-04-alpha-findings.md"));
});

test("contributions page lists Claude Code proposals that a researcher decided", () => {
  const m = model();
  assert.match(section(renderSite(m).get("contributions/index.html"), "Proposed by Claude Code and decided by a researcher"), /No decisions/);
  m.decisions[1].decidedBy = ["fmm"];
  const part = section(renderSite(m).get("contributions/index.html"), "Proposed by Claude Code and decided by a researcher");
  assert.match(part, /D2/);
});

test("contributions page shows replaced pairs, corrections and checks", () => {
  const html = site().get("contributions/index.html");
  assert.ok(html.includes("D1 \u2192 replaced by D3"));
  assert.ok(html.includes("D2 \u2192 replaced by D3"));
  const part = section(html, "Corrections and checks");
  assert.match(part, /Correction/);
  assert.match(part, /Decided by/);
  assert.match(part, /Checked against the call log\./);
  assert.match(part, /Fiona Miller/);
  assert.ok(!html.includes("Corrections and checks by the researchers"));
});

test("contributions page keeps a correction by a built-in ID, with its By (Ruling 12)", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-claude-fix-"));
  try {
    cpSync("tests/fixtures/full", dir, { recursive: true });
    const p = join(dir, "replication_materials/project/decisions.md");
    writeFileSync(p, readFileSync(p, "utf8") + "| D1 | Evidence | x | claude | 2026-10-07 | Fixed the quote. |\n");
    const m = loadProject(dir, OPTS);
    assert.equal(m.decisions.find((d) => d.id === "D1").checked, false);
    const part = section(renderSite(m).get("contributions/index.html"), "Corrections and checks");
    assert.match(part, /<tr><td>D1<\/td><td>Correction<\/td><td>Claude Code<\/td><td>2026-10-07<\/td><td>Evidence: Fixed the quote\.<\/td><\/tr>/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("contributions page lists each check of a decision (M1)", () => {
  const m = model();
  m.decisions[1].checks.push({ by: "Alex Avila", byId: "aav", date: "2026-10-07", note: "Second look." });
  const part = section(renderSite(m).get("contributions/index.html"), "Corrections and checks");
  assert.equal(part.match(/<td>Check<\/td>/g).length, 2);
  assert.ok(part.indexOf("Checked against the call log.") < part.indexOf("Second look."));
});

test("contributions page shows the status and the authorship of the account (I5)", () => {
  assert.ok(site().get("contributions/index.html").includes("<p>Status: Draft. Written by: Claude Code (draft). Approved by: -.</p>"));
  const m = model();
  Object.assign(m.documents.find((d) => d.path === "project/contributions.md"), { status: null, writtenBy: null, approvedBy: "<b>fmm</b>." });
  assert.ok(renderSite(m).get("contributions/index.html").includes("<p>Status: -. Written by: -. Approved by: &lt;b&gt;fmm&lt;/b&gt;.</p>"));
});

test("contributions page links the account and counts unchecked decisions", () => {
  const html = site().get("contributions/index.html");
  assert.ok(html.includes("Draft"));
  assert.ok(html.includes("Contributions of the researchers"));
  assert.ok(html.includes('href="../docs/project/contributions/index.html"'));
  assert.equal((html.match(/not checked by a person/g) ?? []).length, 2);
  assert.match(html, /1 decision is not checked by a person\. The Decisions page marks each of them\./);
});

test("contributions page without an account says so", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-nocontrib-"));
  try {
    cpSync("tests/fixtures/full", dir, { recursive: true });
    rmSync(join(dir, "replication_materials/project/contributions.md"));
    const s = renderSite(loadProject(dir, OPTS));
    assert.ok(s.get("contributions/index.html").includes("The researchers have not written their account yet."));
    assert.ok(!s.has("docs/project/contributions/index.html"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  assert.ok(site().has("docs/project/contributions/index.html"));
});

test("contributions page empty state and escaping", () => {
  const m = { ...model(), decisions: [], topics: [] };
  assert.ok(renderSite(m).get("contributions/index.html").includes("No decisions yet."));
  const m2 = model();
  m2.decisions[0].text = "<b>x</b>";
  m2.decisions[0].corrected = { by: "<i>y</i>", date: "2026-10-06", notes: ["<u>z</u>"], fields: ["<s>f</s>"] };
  const h2 = renderSite(m2).get("contributions/index.html");
  assert.ok(!h2.includes("<b>x</b>") && !h2.includes("<i>y</i>") && !h2.includes("<u>z</u>") && !h2.includes("<s>f</s>"));
});

test("decisions page shows the time, the topic filter and the detail notes", () => {
  const html = site().get("decisions/index.html");
  assert.ok(html.includes("2026-10-03 21:05"));
  assert.match(html, /data-filter-key="topic" data-filter-value="prompts"/);
  assert.match(html, /data-topic="prompts"/);
  assert.match(html, /data-topic=""/);
  assert.ok(!html.includes('data-filter-value="No topic"'));
  assert.ok(html.includes("Impact: Shorter prompts cost less."));
  assert.ok(html.includes("Replaces D1, D2."));
  assert.ok(html.includes('<span class="note">Not checked by a person.</span>'));
});

const decisionRow = (html, id) => html.match(new RegExp(`<tr data-row[^>]*><td>${id}</td>[^]*?</tr>`))[0];

test("decisions page notes each check, and a checked classified row has no mark (I2)", () => {
  const d2 = decisionRow(site().get("decisions/index.html"), "D2");
  assert.ok(d2.includes('<span class="note">Checked by Fiona Miller, 2026-10-06.</span>'), d2);
  assert.ok(!/not checked by a person/i.test(d2), d2);
  assert.ok(/Not checked by a person/.test(decisionRow(site().get("decisions/index.html"), "D1")));
  const m = model();
  m.decisions[1].checks.push({ by: "<i>Alex</i>", byId: "aav", date: "2026-10-07", note: "" });
  const two = decisionRow(renderSite(m).get("decisions/index.html"), "D2");
  const [first, second] = ["Checked by Fiona Miller, 2026-10-06.", "Checked by &lt;i&gt;Alex&lt;/i&gt;, 2026-10-07."].map((s) => two.indexOf(s));
  assert.ok(first > 0 && second > first, two);
});

test("decisions page has the topic grid and the time bins", () => {
  const html = site().get("decisions/index.html");
  const grid = html.match(/<caption>Who decided, by topic<\/caption>[^]*?<\/table>/)[0];
  assert.match(grid, /prompts/);
  assert.match(grid, /No topic/);
  assert.match(grid, /Total/);
  const over = html.match(/<caption>Decisions over time<\/caption>[^]*?<\/table>/)[0];
  assert.match(over, /2026-10-01/);
  assert.match(over, /2026-10-03/);
  assert.match(over, /aria-hidden="true"/);
});

test("decisions over time uses hours when all decisions share one date", () => {
  const m = model();
  m.decisions = m.decisions.slice(0, 3).map((d, i) => ({ ...d, date: "2026-10-03", time: i === 2 ? "21:05" : null }));
  const over = renderSite(m).get("decisions/index.html").match(/<caption>Decisions over time<\/caption>[^]*?<\/table>/)[0];
  assert.match(over, /21:00/);
  assert.match(over, /No time/);
  assert.ok(over.lastIndexOf("No time") > over.indexOf("21:00"));
});

test("decisions page without topics has no topic filter or grid, and escapes impact", () => {
  const m = model();
  m.topics = [];
  m.decisions.forEach((d) => { d.topic = null; });
  m.decisions[2].impact = "<script>alert(2)</script>";
  const html = renderSite(m).get("decisions/index.html");
  assert.ok(!html.includes('data-filter-key="topic"'));
  assert.ok(!html.includes("Who decided, by topic"));
  assert.ok(html.includes("Impact: &lt;script&gt;alert(2)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(2)"));
});

test("Records has Milestone, Size and Links columns", () => {
  const html = site().get("records/index.html");
  for (const h of ["Date", "Title", "Kind", "Milestone", "Size", "Status", "Links"]) {
    assert.match(html, new RegExp(`<th[^>]*>${h}</th>`), h);
  }
  assert.ok(html.includes("3 tasks"));
  assert.ok(html.includes("2 tasks complete; 2 rulings"));
  assert.ok(html.includes(`href="${REPO}/blob/main/replication_materials/plans/2026-10-02-alpha-plan.md" aria-label="GitHub: Alpha plan">GitHub</a>`));
  assert.ok(html.includes('href="../docs/plans/2026-10-02-alpha-plan/index.html" aria-label="Page: Alpha plan">Page</a>'));
});

test("the short links of Records and Releases name their target (M3)", () => {
  const m = model();
  m.documents[1].title = 'Plan "<x>"';
  const rec = renderSite(m).get("records/index.html");
  assert.ok(rec.includes('aria-label="Page: Plan &quot;&lt;x&gt;&quot;">Page</a>'), "escaped title");
  assert.ok(rec.includes('aria-label="GitHub: Plan &quot;&lt;x&gt;&quot;">GitHub</a>'));
  const rel = site().get("releases/index.html");
  assert.ok(rel.includes(`<a href="${REPO}/tree/v0.2.0" aria-label="Files at this tag: v0.2.0">Files at this tag</a>`));
  assert.ok(rel.includes(`<a href="${REPO}/tree/v0.1.0" aria-label="Files at this tag: v0.1.0">Files at this tag</a>`));
});

test("Home has Now before Status, and links every nav page", () => {
  const html = site().get("index.html");
  assert.ok(html.indexOf("<h2>Now</h2>") > 0 && html.indexOf("<h2>Now</h2>") < html.indexOf("<h2>Status</h2>"));
  const now = html.slice(html.indexOf("<h2>Now</h2>"), html.indexOf("<h2>Status</h2>"));
  assert.ok(now.includes("v0.2.0") && now.includes("2026-10-12"));
  assert.ok(now.includes("M2"));
  assert.ok(now.includes("O1"));
  const pages = html.slice(html.indexOf("<h2>Pages</h2>"));
  const labels = [...pages.matchAll(/<li><a [^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ["Process", "Timeline", "Progress", "Decisions", "Contributions", "Records", "Results", "Releases", "Repository"]);
});

test("Now empty states", () => {
  const m = { ...model(), releases: [], openItems: [], status: { current: null, next: null } };
  const html = renderSite(m).get("index.html");
  assert.ok(html.includes("No release yet."));
  assert.ok(html.includes("No milestone is in progress."));
  assert.ok(html.includes("No open items."));
});
