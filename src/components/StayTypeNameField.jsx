import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { STAY_TYPE_OPTIONS, toStayTypeOption } from "@/lib/stayTypes";

const CUSTOM = "__custom__";

// Dropdown of the standard stay types plus "Other (custom name)". It only
// ever changes the name -- check-in/out times and price stay manual.
const StayTypeNameField = ({ form, setForm }) => {
  // Editing a name that isn't a standard type starts in custom mode.
  const [custom, setCustom] = useState(
    () => !!form.name && !toStayTypeOption(form.name),
  );
  const selectValue = custom ? CUSTOM : toStayTypeOption(form.name);

  const handleSelect = (e) => {
    const value = e.target.value;
    if (value === CUSTOM) {
      setCustom(true);
      setForm({ ...form, name: "" });
    } else {
      setCustom(false);
      setForm({ ...form, name: value });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectValue}
        onChange={handleSelect}
        className="border-input flex h-9 w-full rounded-md border bg-white px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm"
      >
        <option value="" disabled>
          Select a stay type
        </option>
        {STAY_TYPE_OPTIONS.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={CUSTOM}>Other (custom name)</option>
      </select>

      {custom && (
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Custom stay type name"
        />
      )}
    </div>
  );
};

export default StayTypeNameField;
