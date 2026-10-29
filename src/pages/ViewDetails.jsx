import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, Check, Star, Images } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import BookingSteps from "@/components/BookingSteps";
import Pagination from "@/components/Pagination";
import StarRating from "@/components/StarRating";
import RoomPreviewDialog from "@/components/RoomPreviewDialog";
import { goToBooking } from "@/lib/bookingGate";
import { API_URL } from "../../config";
import ResortLocation from "../components/ResortLocation";

const REVIEWS_PER_PAGE = 5;

const ViewDetails = () => {
  const { id } = useParams();
  const [resort, setResort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [previewRoom, setPreviewRoom] = useState(null);

  const navigate = useNavigate();

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

  useEffect(() => {
    axios
      .get(`${API_URL}/api/resorts/${id}/reviews`)
      .then((res) => setReviews(res.data.reviews))
      .catch((err) => console.error("Error fetching reviews:", err));
  }, [id]);

  const indexOfLastReview = reviewPage * REVIEWS_PER_PAGE;
  const currentReviews = reviews.slice(
    indexOfLastReview - REVIEWS_PER_PAGE,
    indexOfLastReview,
  );
  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  const handleBookNow = () => goToBooking(resort.id);

  if (loading)
    return (
      <div className="pt-32 pb-16 text-center text-ink/60">Loading...</div>
    );
  if (error)
    return <div className="pt-32 pb-16 text-center text-seal">{error}</div>;
  if (!resort)
    return (
      <div className="pt-32 pb-16 text-center text-ink/60">
        Resort not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-sand-light px-4 pt-28 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <BookingSteps current={1} />

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              {resort.name}
            </h1>
            {resort.stayTypes && resort.stayTypes.length > 0 && (
              <p className="text-right">
                <span className="font-display text-2xl font-semibold text-lagoon-dark">
                  {(() => {
                    const prices = resort.stayTypes.map((st) =>
                      Number(st.price),
                    );
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    return min === max
                      ? `₱${min.toLocaleString()}`
                      : `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;
                  })()}
                </span>
                <span className="text-sm text-ink/50"> per stay</span>
              </p>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-8">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-1 size-4 shrink-0 text-lagoon-dark" />
              <div className="min-w-0">
                {resort.barangay && (
                  <p className="font-medium leading-snug text-ink">
                    {resort.barangay}
                  </p>
                )}
                <ResortLocation
                  resort={resort}
                  className="text-sm leading-snug text-ink/60 sm:text-base"
                />
              </div>
            </div>

            {resort.rating?.count > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-ink/60 sm:mt-0.5 sm:text-base">
                <Star className="size-4 shrink-0 fill-lagoon text-lagoon" />
                <span className="font-medium text-ink">
                  {resort.rating.average.toFixed(1)}
                </span>
                ({resort.rating.count} review
                {resort.rating.count > 1 ? "s" : ""})
              </div>
            )}
          </div>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
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
                      className="block h-[420px] w-full rounded-2xl object-cover"
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

          <h2 className="mt-8 font-display text-xl font-semibold text-ink">
            Rooms Included in Your Stay
          </h2>
          <p className="mt-1 text-sm text-ink/50">
            This is a private resort -- booking it includes every room below,
            all to yourselves.
          </p>
          {resort.rooms && resort.rooms.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {resort.rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-sand-light px-4 py-3"
                >
                  <span className="font-medium text-ink">{room.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setPreviewRoom(room)}
                  >
                    <Images className="size-3.5" />
                    View Room
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink/50">No rooms listed.</p>
          )}

          <h2 className="mt-8 font-display text-xl font-semibold text-ink">
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

          <h2 className="mt-8 font-display text-xl font-semibold text-ink">
            Reviews
          </h2>
          {reviews.length > 0 ? (
            <>
              <div className="mt-3 flex flex-col gap-3">
                {currentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-ink/10 bg-sand-light px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-xs text-ink/50">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-ink/75">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium text-ink/60">
                      {review.username} · Verified Stay
                    </p>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={reviewPage}
                totalPages={totalReviewPages}
                onPageChange={setReviewPage}
              />
            </>
          ) : (
            <p className="mt-2 text-sm text-ink/50">
              No reviews yet. Be the first to share your stay!
            </p>
          )}

          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={handleBookNow}>
              Book Now
            </Button>
          </div>
        </div>
      </div>

      <RoomPreviewDialog
        room={previewRoom}
        open={!!previewRoom}
        onOpenChange={(open) => !open && setPreviewRoom(null)}
      />
    </div>
  );
};

export default ViewDetails;
