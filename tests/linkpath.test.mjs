import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync("skills/replication-materials/scripts/lib/linkpath.js", "utf8");
const resolveLink = new Function(`${src}; return resolveLink;`)();
const BLOB = "https://github.com/e/f/blob/main/replication_materials/";
const ctx = {
  folder: "plans", blobBase: BLOB,
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
