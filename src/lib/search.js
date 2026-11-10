// Lowercase and strip accents, so "jose" finds "José".
export const normalizeText = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const tokenize = (q) =>
  normalizeText(q)
    .split(/[\s,]+/)
    .filter(Boolean);

export const digitsOf = (s) => String(s ?? "").replace(/\D/g, "");

// Every word in the query must appear somewhere in the given texts.
// An empty query matches everything.
export function allWordsIn(query, ...texts) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const hay = normalizeText(texts.join(" "));
  return tokens.every((t) => hay.includes(t));
}

// Phone search that ignores formatting: "0917 123 4567", "+63 917 123 4567"
// and "1234" all find 09171234567. Needs 3+ digits so a stray "2" doesn't
// match every number.
export function phoneContains(phone, query) {
  const q = digitsOf(query);
  if (q.length < 3) return false;
  const p = digitsOf(phone);
  if (p.includes(q)) return true;
  return q.startsWith("63") && p.includes("0" + q.slice(2));
}
