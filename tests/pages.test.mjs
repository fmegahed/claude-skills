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
});

test("progress shows tasks and calls", () => {
  const html = site().get("progress/index.html");
  assert.ok(html.includes("2 of 3"));
  assert.ok(html.includes("jev"));
  assert.ok(html.includes("0.003"));
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
