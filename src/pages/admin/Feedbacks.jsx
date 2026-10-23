import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useSingleFlight from "@/hooks/useSingleFlight";
import Pagination from "@/components/Pagination";
import StarRating from "@/components/StarRating";
import { API_URL } from "../../../config";

const FEEDBACKS_PER_PAGE = 6;

const CustomerFeedback = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runDelete, deleting] = useSingleFlight();
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("token");

  const fetchReviews = () => {
    axios
      .get(`${API_URL}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReviews(res.data))
      .catch((err) => console.error("Error fetching reviews:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (reviewId) => {
    Swal.fire({
      title: "Delete this review?",
      text: "This will permanently remove the review from the resort's page.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (!result.isConfirmed) return;

      runDelete(async () => {
        setDeletingId(reviewId);
        try {
          await axios.delete(`${API_URL}/api/reviews/${reviewId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Review deleted.");
          fetchReviews();
        } catch (err) {
          console.error("Error deleting review:", err);
          toast.error("Failed to delete review.");
        } finally {
          setDeletingId(null);
        }
      });
    });
  };

  const indexOfLast = currentPage * FEEDBACKS_PER_PAGE;
  const currentReviews = reviews.slice(
    indexOfLast - FEEDBACKS_PER_PAGE,
    indexOfLast,
  );
  const totalPages = Math.ceil(reviews.length / FEEDBACKS_PER_PAGE);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Customer Reviews
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Reviews are only left by guests with a completed, confirmed booking.
      </p>

      {loading ? (
        <p className="mt-10 text-center text-ink/60">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-10 text-center text-ink/60">No reviews yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {currentReviews.map((review) => (
            <Card key={review.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <StarRating value={review.rating} size="sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-ink/40 hover:bg-seal/10 hover:text-seal"
                  onClick={() => handleDelete(review.id)}
                  disabled={deleting}
                  aria-label="Delete review"
                >
                  {deletingId === review.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>

              <p className="mt-3 flex-1 text-sm italic leading-relaxed text-ink/75">
                {review.comment ? `"${review.comment}"` : "No comment left."}
              </p>

              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="text-sm font-semibold text-ink">
                  {review.username}
                </p>
                <p className="text-xs text-ink/50">
                  {review.resort_name} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CustomerFeedback;
