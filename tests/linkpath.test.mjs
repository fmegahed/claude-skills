import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("skills/replication-materials/scripts/lib/linkpath.js", "utf8");
const lib = new Function(`${src}; return {
  resolveLink,
  resolveImage: typeof resolveImage === "function" ? resolveImage : undefined,
  shieldMath: typeof shieldMath === "function" ? shieldMath : undefined,
  restoreMath: typeof restoreMath === "function" ? restoreMath : undefined,
};`)();
const { resolveLink } = lib;
const BLOB = "https://github.com/e/f/blob/main/replication_materials/";
const RAW = "https://raw.githubusercontent.com/e/f/main/replication_materials/";
const ctx = {
  folder: "plans", blobBase: BLOB, rawBase: RAW,
  pages: { "plans/b.md": "../b/index.html", "findings/x.md": "../../findings/x/index.html" },
};

test("same-folder md link goes to the document page", () => {
  assert.equal(resolveLink(ctx, "b.md"), "../b/index.html");
});
test("../ to another record folder goes to its page", () => {
  assert.equal(resolveLink(ctx, "../findings/x.md"), "../../findings/x/index.html");
});
test("md link with a fragment keeps the fragment", () => {
  assert.equal(resolveLink(ctx, "b.md#step-2"), "../b/index.html#step-2");
});
test("other file in the record goes to the repository blob", () => {
  assert.equal(resolveLink(ctx, "data.csv"), `${BLOB}plans/data.csv`);
});
test("../../ leaves the record root", () => {
  assert.equal(resolveLink(ctx, "../../src/fit.py"), "https://github.com/e/f/blob/main/src/fit.py");
});
test("absolute, scheme and fragment-only links are left alone", () => {
  for (const h of ["https://x.org/a", "mailto:a@b.c", "#top", "/abs"]) assert.equal(resolveLink(ctx, h), null);
});
test("a root-level document resolves without a folder", () => {
  assert.equal(resolveLink({ ...ctx, folder: "" }, "plans/b.md"), "../b/index.html");
});

test("a relative image loads the raw file from the repository", () => {
  assert.equal(typeof lib.resolveImage, "function", "resolveImage is defined");
  assert.equal(lib.resolveImage(ctx, "figures/x.png"), `${RAW}plans/figures/x.png`);
  assert.equal(lib.resolveImage(ctx, "../findings/fig 1.png"), `${RAW}findings/fig%201.png`);
  assert.equal(lib.resolveImage(ctx, "../../docs/logo.svg"), "https://raw.githubusercontent.com/e/f/main/docs/logo.svg");
  // A record document is not a page for an image: the image still loads the raw file.
  assert.equal(lib.resolveImage(ctx, "b.md"), `${RAW}plans/b.md`);
  for (const s of ["https://x.org/a.png", "data:image/png;base64,AAAA", "/abs.png"]) assert.equal(lib.resolveImage(ctx, s), null);
});

// Shield, then restore: the placeholders must give back the exact source.
function roundTrip(md) {
  const shield = lib.shieldMath(md);
  return { shield, back: lib.restoreMath(shield.text, shield) };
}

test("math spans are shielded from marked and restored exactly", () => {
  assert.equal(typeof lib.shieldMath, "function", "shieldMath is defined");
  const aligned = "$$\n\\begin{aligned}\na &= b \\\\\nc &= d\n\\end{aligned}\n$$";
  const md = `Set $S=\\{x : x > 0\\}$ and $a*b*c$.\n\n${aligned}\n`;
  const { shield, back } = roundTrip(md);
  assert.deepEqual(shield.spans, ["$S=\\{x : x > 0\\}$", "$a*b*c$", aligned]);
  for (const ch of ["\\", "*", "{", "$"]) assert.ok(!shield.text.includes(ch), `${ch} is hidden from marked`);
  assert.match(shield.text, /^Set \w+ and \w+\.\n\n\w+\n$/);
  assert.equal(back, md);
});

test("code spans, code fences and escaped dollars are not shielded", () => {
  const md = [
    "Run `echo $HOME $PATH` now.",
    "Keep ``a `$x$` b`` too.",
    "Costs \\$5 and \\$6.",
    "```bash",
    "copy=$(basename \"$plan\")",
    "```",
    "~~~",
    "$a$",
    "~~~",
  ].join("\n");
  const { shield, back } = roundTrip(md);
  assert.deepEqual(shield.spans, []);
  assert.equal(shield.text, md);
  assert.equal(back, md);
});

test("inline math stays on one line; display math stops at a blank line", () => {
  assert.deepEqual(lib.shieldMath("Pay $5 today\nand $6 tomorrow.").spans, []);
  assert.deepEqual(lib.shieldMath("$$a\n\nb$$").spans, []);
  assert.deepEqual(lib.shieldMath("$$a\nb$$").spans, ["$$a\nb$$"]);
  assert.deepEqual(lib.shieldMath("$\\text{a}$ and $a{$}b$").spans, ["$\\text{a}$", "$a{$}b$"]);
});

test("in a table row, math never crosses a cell and an escaped pipe is a pipe", () => {
  assert.deepEqual(lib.shieldMath("| $5 | $6 |").spans, []);
  const { shield, back } = roundTrip("| $P(Y \\| X)$ | b |");
  assert.deepEqual(shield.spans, ["$P(Y | X)$"]);
  assert.equal(back, "| $P(Y | X)$ | b |");
  assert.deepEqual(lib.shieldMath("A norm $\\|x\\|$ in prose.").spans, ["$\\|x\\|$"]);
});

test("the placeholder key is not in the document", () => {
  const md = "The word mathspan and mathspanx appear. $x$";
  const shield = lib.shieldMath(md);
  assert.ok(!md.includes(shield.key));
  assert.equal(lib.restoreMath(shield.text, shield), md);
});
