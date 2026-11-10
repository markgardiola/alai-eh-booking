import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
}) => (
  <div className={cn("relative w-full sm:max-w-sm", className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      autoComplete="off"
      className="bg-white pl-9 pr-9 text-base sm:text-sm"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 transition-colors hover:bg-sand hover:text-ink"
      >
        <X className="size-4" />
      </button>
    )}
  </div>
);

export default SearchInput;
