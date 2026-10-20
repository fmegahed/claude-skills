import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrast } from "./contrast.mjs";

const brand = JSON.parse(
  readFileSync(new URL("../brand/miami.json", import.meta.url), "utf8"),
);

test("palette has the 11 brand colours with exact hex", () => {
  const c = brand.colors;
  assert.equal(c.miami_red.hex, "#C41230");
  assert.equal(c.accent_red.hex, "#AD102A");
  assert.equal(c.warm_white.hex, "#FAF9F7");
  assert.equal(c.slate_blue.hex, "#3E5468");
  assert.equal(Object.keys(c).length, 11);
});

test("every approved pairing meets 4.5:1", () => {
  let count = 0;
  let min = Infinity;
  for (const [bg, texts] of Object.entries(brand.approved_text_on)) {
    for (const text of texts) {
      const ratio = contrast(brand.colors[bg].hex, brand.colors[text].hex);
      assert.ok(ratio >= 4.5, `${text} on ${bg}: ${ratio.toFixed(2)}`);
      count += 1;
      min = Math.min(min, ratio);
    }
  }
  assert.equal(count, 40);
  assert.equal(Math.round(min * 100) / 100, 4.63);
});
