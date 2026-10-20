import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTables, findTable, readMeta, RecordFormatError } from "../skills/replication-materials/scripts/lib/tables.mjs";

const LF = "## Decisions\n\n| ID | What |\n|----|------|\n| D1 | first |\n| D2 | second |\n";

test("parses a table under a heading", () => {
  const [t] = parseTables(LF, "d.md");
  assert.equal(t.heading, "Decisions");
  assert.deepEqual(t.columns, ["ID", "What"]);
  assert.equal(t.rows[1].cells.ID, "D2");
  assert.equal(t.rows[0].line, 5);
});

test("CRLF input gives the same cells", () => {
  assert.deepEqual(parseTables(LF.replace(/\n/g, "\r\n"), "d.md"), parseTables(LF, "d.md"));
});

test("escaped pipe stays in one cell", () => {
  const [t] = parseTables("| A |\n|---|\n| `a \\| b` |\n", "d.md");
  assert.equal(t.rows[0].cells.A, "`a | b`");
});

test("ignores a table inside a code fence", () => {
  const text = "## Real\n\n```\n## Fake\n| A |\n|---|\n| x |\n```\n\n~~~\n| B |\n|---|\n| y |\n~~~\n";
  assert.deepEqual(parseTables(text, "d.md"), []);
});

test("row with too few cells throws with file and line", () => {
  const text = "## Decisions\n| ID | What | How |\n|---|---|---|\n| D1 | x |\n";
  assert.throws(() => parseTables(text, "d.md"), { message: /^d\.md:4: row has 2 cells/ });
});

test("findTable names the missing column", () => {
  const tables = parseTables("## Decisions\n\n| ID | What |\n|--|--|\n| D1 | x |\n", "d.md");
  assert.throws(() => findTable(tables, "Decisions", ["ID", "What", "How"], "d.md"), {
    message: /^d\.md:3: table "Decisions" lacks column\(s\) How\./,
  });
  assert.throws(() => findTable(tables, "Nope", ["ID"], "d.md"), RecordFormatError);
});

test("readMeta reads title and Item/Value table", () => {
  const { title, meta } = readMeta("# My Project\n\n| Item | Value |\n|---|---|\n| Status | Draft |\n", "d.md");
  assert.equal(title, "My Project");
  assert.equal(meta.Status, "Draft");
});

test("readMeta ignores a malformed table elsewhere in the document", () => {
  const text = "# Doc\n\n| A | B |\n|---|---|\n| only one |\n\n| Item | Value |\n|---|---|\n| Status | Draft |\n";
  const { title, meta } = readMeta(text, "d.md");
  assert.equal(title, "Doc");
  assert.equal(meta.Status, "Draft");
});
