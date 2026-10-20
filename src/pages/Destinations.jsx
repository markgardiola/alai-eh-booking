import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import WaveDivider from "@/components/WaveDivider";
import { API_URL } from "../../config";

const Destinations = ({ searchTerm }) => {
  const [destinations, setDestinations] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    axios
      .get(`${API_URL}/api/destinations`)
      .then((res) => setDestinations(res.data))
      .catch((err) => console.error("Error fetching destinations:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/resorts`)
      .then((res) => setResorts(res.data))
      .catch((err) => console.error("Error fetching resorts:", err));
  }, []);

  useEffect(() => {
    const filtered = searchTerm
      ? destinations.filter((dest) =>
          dest.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : destinations;
    setFilteredDestinations(filtered);
    setCurrentPage(1);
  }, [searchTerm, destinations]);

  const totalPages = Math.ceil(filteredDestinations.length / itemsPerPage);
  const paginated = filteredDestinations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const [featured, ...rest] = paginated;

  const term = searchTerm?.trim().toLowerCase() || "";
  const matchedResorts = term
    ? resorts.filter((r) => r.name?.toLowerCase().includes(term))
    : [];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-lagoon-dark">
          {searchTerm ? "Search results" : "Where to next"}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink sm:text-5xl">
          {searchTerm ? `"${searchTerm}"` : "Cities of Sto. Tomas"}
        </h2>
      </div>

      {loading ? (
        <p className="text-center text-ink/60">Loading...</p>
      ) : paginated.length > 0 ? (
        <>
          {searchTerm && matchedResorts.length > 0 && (
            <h3 className="mb-4 font-display text-xl font-semibold text-ink">
              Areas
            </h3>
          )}
          {/* Featured destination - wide editorial card */}
          <Link
            to={`/destinations/${featured.slug}`}
            className="group mb-8 grid overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md sm:grid-cols-2"
          >
            <div className="h-56 overflow-hidden sm:h-full">
              <img
                src={featured.image_url}
                alt={featured.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center p-8">
              <h3 className="font-display text-3xl font-semibold text-ink">
                {featured.name}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-ink/70">
                {featured.description}
              </p>
              <span className="mt-5 inline-flex w-fit items-center gap-1.5 text-base font-medium text-lagoon-dark">
                Explore area
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          {/* Rest - compact grid */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-3">
              {rest.map((dest) => (
                <Link
                  key={dest.slug}
                  to={`/destinations/${dest.slug}`}
                  className="group overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {dest.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink/60">
                      {dest.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : matchedResorts.length > 0 ? null : (
        <p className="text-center text-ink/60">
          {searchTerm
            ? `No areas or resorts found for "${searchTerm}".`
            : "No destinations yet -- list a resort to create the first one."}
        </p>
      )}

      {matchedResorts.length > 0 && (
        <div className={searchTerm && paginated.length > 0 ? "mt-12" : ""}>
          <h3 className="mb-4 font-display text-xl font-semibold text-ink">
            Resorts
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {matchedResorts.map((resort) => (
              <Link
                key={resort.id}
                to={`/viewDetails/${resort.id}`}
                className="group overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-36 overflow-hidden">
                  <img
                    src={resort.image}
                    alt={resort.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {resort.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink/60">{resort.barangay}</p>
                  {resort.address && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink/50">
                      {resort.address}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-full p-2 text-ink/60 transition-colors hover:bg-sand disabled:pointer-events-none disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={cn(
                "size-8 rounded-full text-sm transition-colors",
                currentPage === i + 1
                  ? "bg-lagoon text-sand-light"
                  : "text-ink/60 hover:bg-sand",
              )}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-full p-2 text-ink/60 transition-colors hover:bg-sand disabled:pointer-events-none disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      <WaveDivider className="mx-auto mt-16 h-6 w-full max-w-3xl opacity-20" />
    </section>
  );
};

export default Destinations;
