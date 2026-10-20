import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = "/repo/";
const PAGES = [
  "index.html", "records/index.html", "decisions/index.html", "progress/index.html",
  "process/index.html", "docs/plans/2026-10-01-alpha-design/index.html",
  "docs/plans/2026-10-02-alpha-plan/index.html",
];
const WIDTHS = [320, 1280];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function open(page, path, width) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(BASE + path);
  if (path.startsWith("docs/")) {
    // The client removes #doc-fallback after rendering. If the CDN cannot be reached
    // it stays, and the checks run on the fallback page instead.
    await page.locator("#doc-fallback").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
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

  test("design document has a contents rail", async ({ page }) => {
    await open(page, "docs/plans/2026-10-01-alpha-design/index.html", 1280);
    const rail = page.locator('nav[aria-label="Contents"]');
    await expect(rail).toHaveCount(1);
    await expect(rail.locator("a")).toHaveCount(2);
    await expect(page.locator(".doc-layout")).toHaveClass(/has-rail/);
  });

  test("plan document has no rail and no empty first column", async ({ page }) => {
    await open(page, "docs/plans/2026-10-02-alpha-plan/index.html", 1280);
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
});
