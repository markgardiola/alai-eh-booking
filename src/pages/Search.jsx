import React, { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Search = ({ onSearch }) => {
  const [destination, setDestination] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(destination.trim());
  };

  return (
    <div className="relative z-10 mx-auto -mt-12 max-w-2xl px-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:gap-2"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <SearchIcon className="size-4 shrink-0 text-ink/40" />
          <Input
            type="text"
            id="destination"
            name="destination"
            placeholder="Search by area or resort name — e.g. San Vicente, BlueRey"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-base h-11"
          />
        </div>
        <Button type="submit" size="lg" className="rounded-xl">
          Search
        </Button>
      </form>
    </div>
  );
};

export default Search;
