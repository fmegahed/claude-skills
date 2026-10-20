import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrast } from "./contrast.mjs";
import { loadProject } from "../skills/replication-materials/scripts/lib/project.mjs";
import { DEFAULT_TOKENS, escapeHtml, inline, rel, themeCss, pageShell } from "../skills/replication-materials/scripts/lib/html.mjs";

const brand = JSON.parse(readFileSync(new URL("../brand/miami.json", import.meta.url), "utf8")).colors;
const model = (theme) => {
  const m = loadProject("tests/fixtures/full", { gitSha: "abc1234", buildDate: "2026-10-19" });
  if (theme) m.config.theme = theme;
  return m;
};

test("default tokens agree with brand/miami.json", () => {
  const map = { bg: "warm_white", surface: "white", tan: "light_tan", ink: "black", muted: "medium_gray", rule: "medium_tan", accent: "miami_red", "accent-strong": "accent_red", "on-accent": "white" };
  assert.deepEqual(Object.keys(DEFAULT_TOKENS).sort(), Object.keys(map).sort());
  for (const [token, key] of Object.entries(map)) assert.equal(DEFAULT_TOKENS[token], brand[key].hex, token);
});

test("default text pairings meet 4.5:1", () => {
  const t = DEFAULT_TOKENS;
  for (const fg of ["ink", "muted", "accent", "accent-strong"])
    for (const bg of ["bg", "surface", "tan"]) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${fg} on ${bg}`);
  for (const bg of ["accent", "accent-strong"]) assert.ok(contrast(t["on-accent"], t[bg]) >= 4.5, `on-accent on ${bg}`);
});

test("escapeHtml escapes script", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
  assert.equal(escapeHtml(`&"'`), "&amp;&quot;&#39;");
});

test("inline keeps javascript: links as text", () => {
  const out = inline("[x](javascript:alert(1))");
  assert.ok(!out.includes("<a"));
  assert.ok(out.includes("javascript:"));
});

test("inline makes https links and code", () => {
  const out = inline("[x](https://x.org) and `a`");
  assert.ok(out.includes('<a href="https://x.org">x</a>'));
  assert.ok(out.includes("<code>a</code>"));
});

test("rel gives relative paths", () => {
  assert.equal(rel("index.html", "decisions/index.html"), "decisions/index.html");
  assert.equal(rel("docs/plans/a/index.html", "index.html"), "../../../index.html");
});

test("pageShell is a full accessible document", () => {
  const html = pageShell({ path: "index.html", title: "Home", body: "<p>x</p>", model: model() });
  assert.ok(html.startsWith("<!doctype html>"));
  for (const s of ['lang="en"', 'name="viewport"', 'href="#main"', 'aria-current="page"', "Built from commit abc1234 on 2026-10-19."])
    assert.ok(html.includes(s), s);
  assert.ok(!html.includes('href="/') && !html.includes('src="/'));
  const doc = pageShell({ path: "docs/plans/a/index.html", title: "A", body: "", model: model() });
  assert.ok(!/<a [^>]*aria-current/.test(doc));
  assert.ok(doc.includes('href="../../../records/index.html"'));
});

test("themeCss uses tokens only and has accessibility rules", () => {
  const css = themeCss(DEFAULT_TOKENS);
  const outside = css.slice(css.indexOf("}") + 1);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(outside), "colour literal outside :root");
  assert.ok(!/rgba?\(|color-mix|opacity/.test(css));
  for (const s of ["color-scheme: light", "min-height: 24px", "scroll-padding-top", "min-width: 900px", ".table-wrap", "prefers-reduced-motion: no-preference"])
    assert.ok(css.includes(s), s);
});

test("theme override from config", () => {
  const html = pageShell({ path: "index.html", title: "Home", body: "", model: model({ accent: "#3E5468" }) });
  assert.ok(html.includes("--accent: #3E5468"));
});

test("button boundary is not --rule alone", () => {
  const css = themeCss(DEFAULT_TOKENS);
  const rule = css.match(/^button, \.button \{[^}]*\}/m)[0];
  assert.match(rule, /border:[^;]*var\(--(ink|accent-strong)\)/);
  assert.ok(!/border:[^;]*var\(--rule\)/.test(rule));
});

test("the document grid applies only when the rail exists", () => {
  const css = themeCss(DEFAULT_TOKENS);
  assert.ok(css.includes(".doc-layout.has-rail"));
  assert.doesNotMatch(css, /\.doc-layout\s*\{/);
  assert.doesNotMatch(css, /\.doc-layout #doc-content/);
});
