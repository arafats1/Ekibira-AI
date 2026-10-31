/**
 * Parse a contact-list CSV (as exported from Excel/Google Sheets) into rows
 * for POST /api/ews/subscribers/import. Column names are matched loosely.
 */

const COLUMNS = {
  name: ["name", "full name", "fullname", "names", "member name"],
  phone: ["phone", "phone number", "phonenumber", "mobile", "mobile number", "msisdn", "telephone", "tel", "contact", "contact number"],
  persona: ["livelihood", "persona", "occupation", "activity", "economic activity", "work", "group"],
  language: ["language", "lang", "preferred language"],
  village: ["village", "cell", "lc1"],
  subCounty: ["sub-county", "subcounty", "sub county"],
  parish: ["parish", "ward"],
  district: ["district"],
};

/** RFC 4180-ish: quoted fields, escaped quotes, commas/semicolons, CRLF. */
function splitRows(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim()));
}

export function parseContactsCsv(text) {
  const rows = splitRows(text.replace(/^﻿/, ""));
  if (!rows.length) throw new Error("The file is empty");
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[_.]+/g, " "));
  const index = {};
  for (const [key, aliases] of Object.entries(COLUMNS)) {
    const i = header.findIndex((h) => aliases.includes(h));
    if (i >= 0) index[key] = i;
  }
  if (index.phone == null) {
    throw new Error(`No phone column found. Name a column "phone" (found: ${header.join(", ")})`);
  }
  let ignored = 0;
  let mangled = 0;
  const out = [];
  for (const r of rows.slice(1)) {
    const row = {};
    for (const [key, i] of Object.entries(index)) row[key] = (r[i] || "").trim();
    if (!row.phone) {
      ignored += 1;
      continue;
    }
    // Excel shows long numbers as 2.56772E+11 and loses digits; the backend
    // rejects them rather than texting a wrong number.
    if (/^\d+(\.\d+)?e\+\d+$/i.test(row.phone)) mangled += 1;
    out.push(row);
  }
  return { rows: out, ignored, mangled, columns: Object.keys(index) };
}
