import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { goToBooking } from "@/lib/bookingGate";
import { API_URL } from "../../config";
import ResortLocation from "./ResortLocation";

/**
 * Shared template for the "explore area" pages, one per barangay. Fed a
 * title/barangay/description by DestinationDetailPage.
 */
const DestinationDetail = ({ title, barangay, description }) => {
  const [resorts, setResorts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const resortsPerPage = 4;

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_URL}/api/resorts/barangay/${barangay}`)
      .then((response) => setResorts(response.data))
      .catch((error) => console.error("Error fetching resorts:", error));
  }, [barangay]);

  const indexOfLastResort = currentPage * resortsPerPage;
  const indexOfFirstResort = indexOfLastResort - resortsPerPage;
  const currentResorts = resorts.slice(indexOfFirstResort, indexOfLastResort);
  const totalPages = Math.ceil(resorts.length / resortsPerPage);

  return (
    <div className="bg-sand-light">
      <PageHero eyebrow="Explore area" title={title} />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <p className="mb-8 text-center text-base text-ink/70">{description}</p>

        {currentResorts.length === 0 ? (
          <p className="text-center text-ink/50">
            No resorts found in this area yet.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {currentResorts.map((resort) => (
              <div
                key={resort.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm sm:flex-row"
              >
                <img
                  src={resort.image}
                  alt={resort.name}
                  className="h-48 w-full object-cover sm:h-auto sm:w-64"
                />
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {resort.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-lagoon-dark">
                      <MapPin className="size-3.5" />
                      <ResortLocation resort={resort} />
                    </p>
                    {resort.rating?.count > 0 && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60">
                        <Star className="size-3.5 fill-lagoon text-lagoon" />
                        <span className="font-medium text-ink">
                          {resort.rating.average.toFixed(1)}
                        </span>
                        ({resort.rating.count} review
                        {resort.rating.count > 1 ? "s" : ""})
                      </p>
                    )}
                    <p className="mt-2 text-sm text-ink/70">
                      {resort.description}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/viewDetails/${resort.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" onClick={() => goToBooking(resort.id)}>
                      Book Now!
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default DestinationDetail;
