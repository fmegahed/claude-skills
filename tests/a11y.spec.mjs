import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";
import { sep } from "node:path";

const BASE = "/repo/";
// A11Y_SITE names a built site to check page by page: playwright.record.config.mjs sets it
// for the record of this repository. Without it, the spec checks the fixture site.
const RECORD = process.env.A11Y_SITE;
const FIXTURE_PAGES = [
  "index.html", "records/index.html", "decisions/index.html", "progress/index.html",
  "process/index.html", "timeline/index.html", "releases/index.html", "results/index.html", "contributions/index.html",
  "docs/project/contributions/index.html", "docs/plans/2026-10-01-alpha-design/index.html",
  "docs/plans/2026-10-02-alpha-plan/index.html",
];
const sitePages = (dir) => readdirSync(dir, { recursive: true }).map((p) => p.split(sep).join("/"))
  .filter((p) => p === "index.html" || p.endsWith("/index.html")).sort();
const PAGES = RECORD ? sitePages(RECORD) : FIXTURE_PAGES;
const WIDTHS = [320, 1280];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function open(page, path, width, { timeout = 15000 } = {}) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(BASE + path);
  if (path.startsWith("docs/")) {
    // The client removes #doc-fallback after rendering. If it stays, the checks would run on
    // the fallback text and not on the rendered document: fail and name the missing libraries.
    try {
      await page.locator("#doc-fallback").waitFor({ state: "detached", timeout });
    } catch {
      const missing = await page.evaluate(() => ["marked", "DOMPurify", "katex", "renderMathInElement"]
        .filter((name) => typeof window[name] === "undefined"));
      throw new Error(`${path}: the document did not render in ${timeout} ms. ` + (missing.length
        ? `The CDN (cdnjs.cloudflare.com) did not load: ${missing.join(", ")}.`
        : "All libraries loaded, so check the browser console for an error in client.js."));
    }
  }
}

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test.describe(`${path} at ${width}px`, () => {
      test("axe finds no WCAG 2.2 AA violation", async ({ page }) => {
        await open(page, path, width);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(violations).toEqual([]);
      });

      if (width === 320) {
        test("no horizontal scroll of the page at 320 px", async ({ page }) => {
          await open(page, path, width);
          const w = await page.evaluate(() => document.documentElement.scrollWidth);
          expect(w).toBeLessThanOrEqual(320);
        });
      }

      test("every link resolves under /repo/", async ({ page, request }) => {
        await open(page, path, width);
        const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
        const here = new URL(page.url());
        const internal = [...new Set(hrefs.filter((h) => new URL(h).origin === here.origin))];
        for (const h of internal) {
          const u = new URL(h);
          u.hash = "";
          expect(u.pathname.startsWith(BASE), `${h} is under ${BASE}`).toBe(true);
          const res = await request.get(u.href);
          expect(res.status(), h).toBe(200);
        }
      });
    });
  }
}

test.describe("at 1280 px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("filters work with the keyboard", async ({ page }) => {
    await open(page, "decisions/index.html", 1280);
    const count = page.locator("[data-filter-count]");
    const before = await count.textContent();
    // The "All" buttons start pressed (no change), so the first filter that changes the list
    // is the first button that is not pressed. Reach it with Tab only.
    const target = page.locator('[data-filters] button[aria-pressed="false"]').first();
    await expect(target).toBeVisible();
    await target.evaluate((el) => (el.dataset.testTarget = "1"));
    const marked = page.locator('[data-test-target="1"]');
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.dataset?.testTarget === "1");
    }
    expect(reached, "Tab reaches the first filter button").toBe(true);
    await page.keyboard.press("Enter");
    await expect(marked).toHaveAttribute("aria-pressed", "true");
    await expect(count).not.toHaveText(before);
  });

  test("focus ring is visible and not covered", async ({ page }) => {
    await open(page, "decisions/index.html", 1280);
    await page.evaluate(() => document.activeElement?.blur());
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const b = el.getBoundingClientRect();
        const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return {
          tag: el.tagName, text: (el.textContent || "").trim().slice(0, 30),
          outline: getComputedStyle(el).outlineStyle,
          covered: !(hit && (hit === el || el.contains(hit))),
        };
      });
      if (!r) continue;
      expect(r.outline, `outline of ${r.tag} ${r.text}`).not.toBe("none");
      expect(r.covered, `${r.tag} ${r.text} is covered`).toBe(false);
    }
  });

});

// These tests need the fixture documents.
if (!RECORD) test.describe("fixture documents at 1280 px", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const DESIGN = "docs/plans/2026-10-01-alpha-design/index.html";
  const PLAN = "docs/plans/2026-10-02-alpha-plan/index.html";

  test("design document has a contents rail", async ({ page }) => {
    await open(page, DESIGN, 1280);
    const rail = page.locator('nav[aria-label="Contents"]');
    await expect(rail).toHaveCount(1);
    await expect(rail.locator("a")).toHaveCount(2);
    await expect(page.locator(".doc-layout")).toHaveClass(/has-rail/);
  });

  test("plan document has no rail and no empty first column", async ({ page }) => {
    await open(page, PLAN, 1280);
    await expect(page.locator('nav[aria-label="Contents"]')).toHaveCount(0);
    const { content, main } = await page.evaluate(() => {
      const layout = document.querySelector(".doc-layout");
      const first = layout.firstElementChild;
      return {
        content: first.getBoundingClientRect().left,
        main: document.querySelector("main").getBoundingClientRect().left,
      };
    });
    expect(Math.abs(content - main)).toBeLessThanOrEqual(40);
  });

  test("each task-list checkbox has a name", async ({ page }) => {
    await open(page, PLAN, 1280);
    const names = await page.$$eval('#doc-content input[type="checkbox"]', (bs) => bs.map((b) => b.getAttribute("aria-label")));
    expect(names).toEqual(["Not done", "Done", "Not done", "Done"]);
  });

  test("math keeps its source: braces, stars and line breaks reach KaTeX", async ({ page }) => {
    await open(page, DESIGN, 1280);
    const tex = await page.$$eval('.katex annotation[encoding="application/x-tex"]', (as) => as.map((a) => a.textContent));
    expect(tex).toContain("\\hat{p}");
    expect(tex).toContain("S=\\{x : x > 0\\}");
    expect(tex).toContain("a*b*c");
    expect(tex.some((t) => t.includes("a &= b \\\\") && t.includes("\\end{aligned}")), tex.join(" | ")).toBe(true);
    const shown = await page.$$eval(".katex .katex-html", (es) => es.map((e) => e.textContent));
    expect(shown.some((t) => t.includes("{") && t.includes("}")), shown.join(" | ")).toBe(true);
    await expect(page.locator("#doc-content em")).toHaveCount(0);
  });

  test("a relative image loads the raw file from the repository", async ({ page }) => {
    await open(page, DESIGN, 1280);
    await expect(page.locator("#doc-content img")).toHaveAttribute("src",
      "https://raw.githubusercontent.com/example/fixture/main/replication_materials/plans/figures/accuracy.png");
  });

  test("a blocked CDN fails the document check with a clear message", async ({ page }) => {
    await page.route("https://cdnjs.cloudflare.com/**", (route) => route.abort());
    await expect(open(page, PLAN, 1280, { timeout: 2000 })).rejects.toThrow(
      /did not render in 2000 ms\. The CDN \(cdnjs\.cloudflare\.com\) did not load: marked, DOMPurify, katex, renderMathInElement\./);
  });
});
