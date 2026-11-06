// The standard stay types in the dropdown. "Other (custom name)" is always
// available too. Times are NOT part of this -- each resort sets its own
// check-in/out times and price.
export const STAY_TYPE_OPTIONS = ["Day Tour", "Overnight", "21-Hour Stay"];

const ALIASES = {
  daytour: "Day Tour",
  overnight: "Overnight",
  overnightstay: "Overnight",
  "21hourstay": "21-Hour Stay",
  "21hoursstay": "21-Hour Stay",
  "21hrstay": "21-Hour Stay",
  "21hrsstay": "21-Hour Stay",
};

// Maps any spelling of a standard type ("Daytour", "day-tour") to its
// official name. Returns "" when the name isn't a standard type.
export function toStayTypeOption(name) {
  const key = String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ALIASES[key] || "";
}
