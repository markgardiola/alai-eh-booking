import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import { Card } from "@/components/ui/card";
import { API_URL } from "../../../config";

const AdminRefundRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState(null); // "<bookingId>:approve|deny"
  const busy = useRef(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchRequests = () => {
    axios
      .get(`${API_URL}/api/bookings/refund-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRequests(res.data))
      .catch((err) => console.error("Error fetching refund requests:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveRefund = (bookingId) => {
    Swal.fire({
      title: "Approve this refund?",
      text: "If paid via PayPal, the payment will be refunded automatically.",
      icon: "question",
      input: "text",
      inputPlaceholder: "Optional note to the customer",
      showCancelButton: true,
      confirmButtonColor: "#3e9c93",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Approve refund",
    }).then((result) => {
      if (!result.isConfirmed) return;
      if (busy.current) return;
      busy.current = true;
      setProcessingKey(`${bookingId}:approve`); // use ":deny" in denyRefund

      axios
        .put(
          `${API_URL}/api/bookings/${bookingId}/refund/approve`,
          { decisionNote: result.value },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then((res) => {
          toast.success(
            res.data.refunded
              ? "Refund approved and processed via PayPal."
              : "Refund approved. Remember to process the GCash refund manually.",
          );
          fetchRequests();
        })
        .catch(err)
        .finally(() => {
          busy.current = false;
          setProcessingKey(null);
        });
    });
  };

  const denyRefund = (bookingId) => {
    Swal.fire({
      title: "Deny this refund request?",
      text: "The booking will remain confirmed.",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Optional reason for the customer",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Deny request",
    }).then((result) => {
      if (!result.isConfirmed) return;

      axios
        .put(
          `${API_URL}/api/bookings/${bookingId}/refund/deny`,
          { decisionNote: result.value },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then(() => {
          toast.success("Refund request denied.");
          fetchRequests();
        })
        .catch((err) => {
          console.error("Error denying refund:", err);
          toast.error(err.response?.data?.error || "Failed to deny refund.");
        });
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Refund Requests
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Bookings customers have asked to cancel and be refunded, awaiting your
        decision.
      </p>

      {loading ? (
        <p className="mt-8 text-ink/60">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-12 text-center">
          <p className="text-ink/60">
            No pending refund requests. You're all caught up!
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {requests.map((r) => (
            <Card key={r.booking_id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {r.resort_name}
                  </h3>
                  <p className="text-sm text-ink/60">
                    Booking #{r.booking_id} &middot; {r.username}
                  </p>
                  <p className="mt-1 text-sm text-ink/60">
                    {r.check_in_display} &rarr; {r.check_out_display}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold text-lagoon-dark">
                    ₱{Number(r.total_price).toLocaleString()}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    {r.payment_method === "paypal" ? "PayPal" : "GCash"}
                  </p>
                </div>
              </div>

              {r.cancellation_reason && (
                <p className="mt-3 rounded-lg bg-sand-light px-3 py-2 text-sm text-ink/70">
                  <span className="font-medium text-ink/50">Reason: </span>
                  {r.cancellation_reason}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/adminDashboard/bookingDetails/${r.booking_id}`)
                  }
                >
                  View Details
                </Button>
                <LoadingButton
                  variant="secondary"
                  size="sm"
                  loading={processingKey === `${r.booking_id}:approve`}
                  loadingText="Processing refund..."
                  disabled={!!processingKey}
                  onClick={() => approveRefund(r.booking_id)}
                >
                  Approve Refund
                </LoadingButton>
                <LoadingButton
                  variant="ghost"
                  size="sm"
                  className="text-seal hover:bg-seal/10 hover:text-seal"
                  loading={processingKey === `${r.booking_id}:deny`}
                  loadingText="Denying..."
                  disabled={!!processingKey}
                  onClick={() => denyRefund(r.booking_id)}
                >
                  Deny
                </LoadingButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRefundRequests;
