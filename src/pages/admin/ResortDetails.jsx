import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Check, UserCircle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { API_URL } from "../../../config";
import ResortLocation from "../../components/ResortLocation";

const formatTime12h = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const ResortDetails = () => {
  const { id } = useParams();
  const [resort, setResort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResort = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/resorts/${id}`);
        setResort(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch resort details.");
        setLoading(false);
      }
    };

    fetchResort();
  }, [id]);

  if (loading) return <div className="text-center text-ink/60">Loading...</div>;
  if (error) return <div className="text-center text-seal">{error}</div>;
  if (!resort)
    return <div className="text-center text-ink/60">Resort not found.</div>;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <Link to="/adminDashboard/resorts">
        <Button variant="outline" size="sm" className="mb-6 gap-1.5">
          <ArrowLeft className="size-4" />
          Back to Listings
        </Button>
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">
        {resort.name}
      </h1>
      {resort.stayTypes && resort.stayTypes.length > 0 && (
        <p className="mt-1 font-display text-lg font-semibold text-lagoon-dark">
          {(() => {
            const prices = resort.stayTypes.map((st) => Number(st.price));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return min === max
              ? `₱${min.toLocaleString()}`
              : `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;
          })()}
          <span className="text-sm font-normal text-ink/50"> per stay</span>
        </p>
      )}
      <div className="mt-3 flex items-start gap-2.5 text-sm">
        <MapPin className="mt-0.5 size-4 shrink-0 text-lagoon-dark" />
        <div className="min-w-0">
          {resort.barangay && (
            <p className="font-medium leading-snug text-ink">
              {resort.barangay}
            </p>
          )}
          <ResortLocation
            resort={resort}
            className="leading-snug text-ink/60"
          />
        </div>
      </div>

      {resort.owner_name && (
        <div className="mt-2.5 flex items-start gap-2.5 text-sm">
          <UserCircle className="mt-0.5 size-4 shrink-0 text-lagoon-dark" />
          <div className="min-w-0">
            <p className="leading-snug">
              <span className="text-ink/50">Owner: </span>
              <span className="font-medium text-ink">{resort.owner_name}</span>
            </p>
            {resort.owner_email && (
              <a
                href={`mailto:${resort.owner_email}`}
                className="block break-all leading-snug text-lagoon-dark hover:underline"
              >
                {resort.owner_email}
              </a>
            )}
          </div>
        </div>
      )}
      <p className="mt-3 text-base leading-relaxed text-ink/75">
        {resort.description}
      </p>

      {resort.images && resort.images.length > 0 ? (
        <Carousel className="mt-6 rounded-2xl">
          <CarouselContent>
            {resort.images.map((img) => (
              <CarouselItem key={img.id}>
                <img
                  src={img.image_url}
                  alt={resort.name}
                  className="block h-60 sm:h-[420px] w-full rounded-2xl object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      ) : (
        resort.image && (
          <img
            src={resort.image}
            alt={resort.name}
            className="mt-6 h-[420px] w-full rounded-2xl object-cover"
          />
        )
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Rooms
      </h2>
      {resort.rooms && resort.rooms.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {resort.rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-xl border border-ink/10 bg-white px-4 py-3"
            >
              <span className="font-medium text-ink">{room.name}</span>
              <span className="text-sm text-ink/50">
                {room.images?.length || 0} photo
                {room.images?.length === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/50">No rooms listed.</p>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Stay Types
      </h2>
      {resort.stayTypes && resort.stayTypes.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {resort.stayTypes.map((stayType) => (
            <div
              key={stayType.id}
              className="rounded-xl border border-ink/10 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{stayType.name}</span>
                <span className="font-display text-lagoon-dark">
                  ₱{Number(stayType.price).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {formatTime12h(stayType.check_in_time)} check-in →{" "}
                {formatTime12h(stayType.check_out_time)}
                {stayType.spans_next_day ? " (next day)" : ""} check-out
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/50">No stay types listed.</p>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">
        Amenities
      </h2>
      {resort.amenities && resort.amenities.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {resort.amenities.map((amenity, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3.5 py-1.5 text-sm text-ink/80"
            >
              <Check className="size-3.5 text-lagoon-dark" />
              {amenity}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/50">No amenities listed.</p>
      )}
    </div>
  );
};

export default ResortDetails;
