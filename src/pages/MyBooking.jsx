import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Users,
  Baby,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import { cn } from "@/lib/utils";
import { API_URL } from "../../config";

const MyBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState(null); // booking being requested for refund
  const [refundReason, setRefundReason] = useState("");
  const [runRefund, submittingRefund] = useSingleFlight();
  const [reviewTarget, setReviewTarget] = useState(null); // booking being reviewed
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [runReview, submittingReview] = useSingleFlight();
  const [runDelete, deleting] = useSingleFlight();
  const bookingsPerPage = 5;
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const fetchBookings = () => {
    axios
      .get(`${API_URL}/api/bookings/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setBookings(res.data))
      .catch((err) => console.error("Error fetching bookings:", err));
  };

  const deleteBooking = async (bookingId) => {
    Swal.fire({
      title: "Remove this booking?",
      text: "This will remove it from your bookings list. It won't affect your booking history on our end.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        runDelete(async () => {
          try {
            await axios.delete(`${API_URL}/api/bookings/${bookingId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchBookings();
            toast.success("Booking removed from your list.");
          } catch (err) {
            console.error("Error deleting booking:", err);
            toast.error("Failed to remove booking.");
          }
        });
      }
    });
  };

  const submitRefundRequest = () => {
    if (!refundTarget) return;

    runRefund(() =>
      axios
        .put(
          `${API_URL}/api/bookings/${refundTarget}/request-refund`,
          { reason: refundReason },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then(() => {
          toast.success("Cancellation/refund request submitted.");
          setRefundTarget(null);
          setRefundReason("");
          fetchBookings();
        })
        .catch((err) => {
          console.error("Error requesting refund:", err);
          toast.error(err.response?.data?.error || "Failed to submit request.");
        }),
    );
  };

  const submitReview = () => {
    if (!reviewTarget || reviewRating === 0) return;

    runReview(() =>
      axios
        .post(
          `${API_URL}/api/reviews`,
          {
            bookingId: reviewTarget,
            rating: reviewRating,
            comment: reviewComment,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then(() => {
          toast.success("Review submitted. Thank you!");
          setReviewTarget(null);
          setReviewRating(0);
          setReviewComment("");
          fetchBookings();
        })
        .catch((err) => {
          console.error("Error submitting review:", err);
          toast.error(
            err.response?.data?.message || "Failed to submit review.",
          );
        }),
    );
  };

  // Mirrors the server-side check in reviewController.createReview: a stay
  // is reviewable once it's Confirmed and the check-out date has passed.
  const isStayOver = (booking) => new Date(booking.check_out) < new Date();

  const canReview = (booking) =>
    booking.status === "Confirmed" &&
    !booking.has_review &&
    isStayOver(booking);

  // Delete is only offered once a booking is "settled" -- either it was
  // Cancelled, or the stay actually happened (checked out, or already
  // reviewed, which can only happen after check-out anyway). Pending
  // bookings are excluded entirely so a user can't hide an active request.
  // Mirrors the eligibility check in bookingController.deleteBooking.
  const canDelete = (booking) =>
    booking.status === "Cancelled" ||
    (booking.status === "Confirmed" &&
      (booking.has_review || isStayOver(booking)));

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking,
  );
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  return (
    <div className="min-h-screen bg-sand-light px-4 pt-28 pb-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-display text-3xl font-semibold text-ink">
          My Bookings
        </h1>

        {bookings.length === 0 ? (
          <p className="mt-10 text-center text-ink/60">No bookings found.</p>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {currentBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {booking.resort_name}
                    </h3>
                    <p className="text-xs text-ink/50">
                      Booked on{" "}
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/70">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-lagoon-dark" />
                    {booking.check_in_display} → {booking.check_out_display}
                  </span>
                  {booking.stay_type_name && (
                    <span className="flex items-center gap-1.5">
                      {booking.stay_type_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4 text-lagoon-dark" />
                    {booking.adults} adult{booking.adults > 1 ? "s" : ""}
                  </span>
                  {booking.children > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Baby className="size-4 text-lagoon-dark" />
                      {booking.children} child
                      {booking.children > 1 ? "ren" : ""}
                    </span>
                  )}
                </div>

                {booking.status === "Refund Requested" && (
                  <p className="mt-3 rounded-lg bg-sand px-3 py-2 text-xs text-ink/60">
                    Your cancellation/refund request is awaiting admin review.
                  </p>
                )}
                {booking.refund_decision_note &&
                  (booking.status === "Confirmed" ||
                    booking.status === "Pending") && (
                    <p className="mt-3 rounded-lg bg-sand px-3 py-2 text-xs text-ink/60">
                      Your previous refund request was denied: "
                      {booking.refund_decision_note}"
                    </p>
                  )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/viewMyBooking/${booking.id}`)}
                  >
                    View Details
                  </Button>

                  {((booking.status === "Confirmed" && !isStayOver(booking)) ||
                    booking.status === "Pending") && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRefundTarget(booking.id);
                        setRefundReason("");
                      }}
                    >
                      Request Cancel / Refund
                    </Button>
                  )}

                  {canReview(booking) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setReviewTarget(booking.id);
                        setReviewRating(0);
                        setReviewComment("");
                      }}
                    >
                      Leave a Review
                    </Button>
                  )}

                  {booking.status === "Confirmed" && booking.has_review && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-lagoon/10 px-3 py-1.5 text-sm text-lagoon-dark">
                      <Star className="size-4 fill-lagoon-dark text-lagoon-dark" />
                      Reviewed
                    </span>
                  )}

                  {canDelete(booking) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-seal hover:bg-seal/10 hover:text-seal"
                      disabled={deleting}
                      onClick={() => deleteBooking(booking.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
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
      </div>

      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Cancel / Refund</DialogTitle>
            <DialogDescription>
              Let us know why you'd like to cancel. An admin will review your
              request -- if approved and you paid via PayPal, your refund is
              processed automatically.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={4}
            placeholder="Reason (optional)"
            className="border-input flex w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRefundTarget(null)}>
              Never mind
            </Button>
            <LoadingButton
              onClick={submitRefundRequest}
              loading={submittingRefund}
              loadingText="Submitting..."
            >
              Submit Request
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => !open && setReviewTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              How was your stay? Your review will be shown publicly on the
              resort's page as a Verified Stay.
            </DialogDescription>
          </DialogHeader>

          <StarRating
            value={reviewRating}
            onChange={setReviewRating}
            size="lg"
          />

          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={4}
            placeholder="Tell other travelers about your stay (optional)"
            className="border-input flex w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReviewTarget(null)}>
              Never mind
            </Button>
            <LoadingButton
              onClick={submitReview}
              loading={submittingReview}
              loadingText="Submitting..."
              disabled={reviewRating === 0}
            >
              Submit Review
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBooking;
