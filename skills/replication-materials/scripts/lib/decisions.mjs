// People, decisions, rulings and corrections read from record files.

import { parseTables, findTable, fenceFlags, RecordFormatError } from "./tables.mjs";

export const PEOPLE_COLUMNS = ["ID", "Name", "Role", "Link"];
export const DECISION_COLUMNS = ["ID", "Date", "Decision", "Proposed by", "Decided by", "How", "Evidence", "Source"];
export const CORRECTION_COLUMNS = ["Decision", "Field", "New value", "Checked by", "Date", "Note"];
export const TOPIC_COLUMNS = ["Topic", "Meaning"];
export const CHECK_COLUMNS = ["Decision", "Checked by", "Date", "Note"];
export const HOW_VALUES = ["chat", "question", "review", "measurement", "plan-approval", "playback", "ruling", "classified"];
export const BUILT_IN_PEOPLE = { claude: "Claude Code", subagent: "Subagent", unknown: "Unknown" };

// Correction "Field" values and the decision property each one replaces.
const CORRECTION_FIELDS = {
  "Decision": "text",
  "Proposed by": "proposedBy",
  "Decided by": "decidedBy",
  "How": "how",
  "Evidence": "evidence",
};

export function readPeople(roadmapText, file) {
  const table = findTable(parseTables(roadmapText, file), "People", PEOPLE_COLUMNS, file);
  const people = new Map();
  for (const [id, name] of Object.entries(BUILT_IN_PEOPLE)) people.set(id, { id, name, role: "", link: "" });
  for (const { line, cells: c } of table.rows) {
    // A row must not replace a built-in name: that would change who a decision shows (A3).
    if (Object.hasOwn(BUILT_IN_PEOPLE, c.ID)) {
      throw new RecordFormatError(file, line,
        `ID "${c.ID}" is a built-in ID. Do not use ${Object.keys(BUILT_IN_PEOPLE).join(", ")} in ## People.`);
    }
    people.set(c.ID, { id: c.ID, name: c.Name, role: c.Role, link: c.Link });
  }
  return people;
}

function personIds(value, people, file, line) {
  const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length) throw new RecordFormatError(file, line, "a person ID is required.");
  for (const id of ids) {
    if (!people.has(id)) {
      throw new RecordFormatError(file, line, `unknown person "${id}". Known IDs: ${[...people.keys()].join(", ")}.`);
    }
  }
  return ids;
}

function checkHow(value, file, line) {
  if (!HOW_VALUES.includes(value)) {
    throw new RecordFormatError(file, line, `How "${value}" is not allowed. Use one of: ${HOW_VALUES.join(", ")}.`);
  }
  return value;
}

// An empty cell or "-" means "not given".
const given = (value) => {
  const v = (value ?? "").trim();
  return v === "" || v === "-" ? null : v;
};

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
const DECISION_ID = /^D(\d+)$/;

// A classified decision is checked when a correction or a check names it.
const isChecked = (d) => d.how !== "classified" || d.corrected !== null || d.check !== null;

export function readTopics(text, file) {
  const table = parseTables(text, file).find((t) => t.heading === "Topics");
  if (!table) return [];
  return findTable([table], "Topics", TOPIC_COLUMNS, file).rows.map(({ cells: c }) => ({
    topic: c.Topic, meaning: c.Meaning,
  }));
}

export function readChecksTable(text, file) {
  const table = parseTables(text, file).find((t) => t.heading === "Checks");
  return table ? findTable([table], "Checks", CHECK_COLUMNS, file) : null;
}

export function readDecisions(text, file, people) {
  const table = findTable(parseTables(text, file), "Decisions", DECISION_COLUMNS, file);
  const topics = readTopics(text, file).map((t) => t.topic);
  if (table.columns.includes("Topic") && !parseTables(text, file).some((t) => t.heading === "Topics")) {
    throw new RecordFormatError(file, table.line, "a Topic column needs a ## Topics table.");
  }
  const seen = new Set();
  const rows = table.rows.map(({ line, cells: c }) => {
    if (seen.has(c.ID)) throw new RecordFormatError(file, line, `duplicate decision ID "${c.ID}".`);
    seen.add(c.ID);
    const time = given(c["Time (UTC)"]);
    if (time !== null && !TIME_OF_DAY.test(time)) {
      throw new RecordFormatError(file, line, `Time (UTC) "${time}" must look like 14:30.`);
    }
    const topic = given(c.Topic);
    if (topic !== null && !topics.includes(topic)) {
      throw new RecordFormatError(file, line, `Topic "${topic}" is not in ## Topics. Use one of: ${topics.join(", ")}.`);
    }
    const replaces = (given(c.Replaces) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const d = {
      id: c.ID,
      date: c.Date,
      time,
      text: c.Decision,
      proposedBy: personIds(c["Proposed by"], people, file, line),
      decidedBy: personIds(c["Decided by"], people, file, line),
      how: checkHow(c.How, file, line),
      evidence: c.Evidence,
      source: c.Source,
      topic,
      impact: given(c.Impact),
      replaces,
      file,
      line,
      corrected: null,
      check: null,
    };
    d.checked = isChecked(d);
    return d;
  });
  // Replaces points to earlier decisions only, so check it after all rows are read.
  for (const d of rows) {
    const mine = DECISION_ID.exec(d.id);
    for (const id of d.replaces) {
      const theirs = DECISION_ID.exec(id);
      if (!theirs) {
        throw new RecordFormatError(file, d.line, `Replaces "${id}" must be a decision ID like D3.`);
      }
      if (!seen.has(id)) throw new RecordFormatError(file, d.line, `unknown decision "${id}".`);
      if (mine && Number(theirs[1]) >= Number(mine[1])) {
        throw new RecordFormatError(file, d.line, `${d.id} cannot replace a later decision ${id}.`);
      }
    }
  }
  return rows;
}

// A ruling line starts with "Ruling:" or "Ruling <n>:", after an optional "- ", backtick
// and "Task <n>:" or "Final:" prefix. Prose that mentions "Ruling:" later in a line is not a ruling.
const RULING = /^\s*(?:-\s+)?(`)?(?:(?:Task \d+[a-z]?|Final):\s+)?Ruling(?:\s+\d+)?:\s*(.+)$/;

export function readRulings(text, ledgerPath) {
  const base = ledgerPath.split("/").pop();
  const m = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)-ledger\.md$/);
  if (!m) {
    throw new RecordFormatError(ledgerPath, 1, `ledger file name must look like YYYY-MM-DD-<topic>-ledger.md, not "${base}".`);
  }
  const [, date, topic] = m;
  const lines = text.split(/\r?\n/);
  const inFence = fenceFlags(lines);
  const rulings = [];
  lines.forEach((line, i) => {
    if (inFence[i]) return;
    const r = line.match(RULING);
    if (!r) return;
    rulings.push({
      id: `R-${date}-${topic}-${rulings.length + 1}`,
      date,
      // Only the form "`Ruling: x`" wraps the line in backticks: then drop the closing one.
      text: (r[1] ? r[2].replace(/`\s*$/, "") : r[2]).trim(),
      proposedBy: ["claude"],
      decidedBy: ["claude"],
      how: "ruling",
      evidence: "",
      source: `${ledgerPath}:${i + 1}`,
      file: ledgerPath,
      line: i + 1,
      corrected: null,
      check: null,
      checked: true,
    });
  });
  return rulings;
}

export function readCorrectionsTable(text, file) {
  const table = parseTables(text, file).find((t) => t.heading === "Corrections");
  return table ? findTable([table], "Corrections", CORRECTION_COLUMNS, file) : null;
}

export function applyCorrections(decisions, table, people, file) {
  const out = decisions.map((d) => ({ ...d }));
  if (!table) return out;
  const byId = new Map(out.map((d) => [d.id, d]));
  for (const { line, cells: c } of table.rows) {
    const d = byId.get(c.Decision);
    if (!d) throw new RecordFormatError(file, line, `correction names unknown decision "${c.Decision}".`);
    const prop = CORRECTION_FIELDS[c.Field];
    if (!prop) {
      throw new RecordFormatError(file, line,
        `correction Field "${c.Field}" is not allowed. Use one of: ${Object.keys(CORRECTION_FIELDS).join(", ")}.`);
    }
    const [checker] = personIds(c["Checked by"], people, file, line);
    const value = c["New value"];
    if (prop === "proposedBy" || prop === "decidedBy") d[prop] = personIds(value, people, file, line);
    else if (prop === "how") d.how = checkHow(value, file, line);
    else d[prop] = value;
    const prev = d.corrected ?? { by: "", date: "", notes: [], fields: [] };
    d.corrected = {
      by: people.get(checker).name,
      date: c.Date,
      notes: c.Note ? [...prev.notes, c.Note] : prev.notes,
      fields: prev.fields.includes(c.Field) ? prev.fields : [...prev.fields, c.Field],
    };
    d.checked = isChecked(d);
  }
  return out;
}

export function applyChecks(decisions, table, people, file) {
  const out = decisions.map((d) => ({ ...d }));
  if (!table) return out;
  const byId = new Map(out.map((d) => [d.id, d]));
  for (const { line, cells: c } of table.rows) {
    const d = byId.get(c.Decision);
    if (!d) throw new RecordFormatError(file, line, `check names unknown decision "${c.Decision}".`);
    const [checker] = personIds(c["Checked by"], people, file, line);
    d.check = { by: people.get(checker).name, date: c.Date, note: c.Note };
    d.checked = isChecked(d);
  }
  return out;
}
