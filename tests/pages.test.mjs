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
import { cpSync, mkdtempSync, rmSync } from "node:fs";
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

test("nav has Releases and Results after Decisions when the files exist", () => {
  const labels = navLabels(site().get("index.html"));
  assert.deepEqual(labels, ["Home", "Records", "Decisions", "Timeline", "Releases", "Results", "Progress", "Process", "Repository"]);
});

test("a record without the two files builds with no pages and no nav items", () => {
  const dir = mkdtempSync(join(tmpdir(), "rm-empty-"));
  try {
    cpSync("tests/fixtures/full", dir, { recursive: true });
    for (const f of ["releases", "results"]) rmSync(join(dir, "replication_materials/project", `${f}.md`));
    const s = renderSite(loadProject(dir, OPTS));
    assert.ok(!s.has("releases/index.html") && !s.has("results/index.html"));
    assert.deepEqual(navLabels(s.get("index.html")), ["Home", "Records", "Decisions", "Timeline", "Progress", "Process", "Repository"]);
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

test("timeline empty state and escaping", () => {
  const empty = renderSite({ ...model(), events: [], decisions: [], releases: [] }).get("timeline/index.html");
  assert.ok(empty.includes("No events yet."));
  const m = model();
  m.events[0].what = "<img src=x>";
  assert.ok(!renderSite(m).get("timeline/index.html").includes("<img src=x>"));
});
