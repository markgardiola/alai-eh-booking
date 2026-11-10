import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import SearchInput from "@/components/SearchInput";
import { allWordsIn } from "@/lib/search";
import { cn } from "@/lib/utils";
import { API_URL } from "../../../config";

const ManageBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingKey, setUpdatingKey] = useState(null); // "<bookingId>:<status>"
  const busy = useRef(false);
  const bookingsPerPage = 5;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchBookings = () => {
    axios
      .get(`${API_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setBookings(res.data))
      .catch((err) => console.error("Error fetching bookings:", err));
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBookingStatus = (bookingId, status) => {
    if (busy.current) return;
    busy.current = true;
    setUpdatingKey(`${bookingId}:${status}`);
    axios
      .put(
        `${API_URL}/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => {
        if (status === "Cancelled" && res.data.refunded) {
          toast.success("Booking cancelled and refunded via PayPal.");
        } else if (status === "Cancelled" && res.data.refundError) {
          toast.warning(
            "Booking cancelled, but the automatic PayPal refund failed -- please refund manually.",
          );
        } else {
          toast.success(`Booking ${status}`);
        }
        fetchBookings();
      })
      .catch((err) => {
        console.error("Error updating status:", err);
        if (err.response?.status === 409) {
          Swal.fire({
            icon: "warning",
            title: "Can't approve this booking",
            text: err.response.data.error,
            confirmButtonColor: "#3e9c93",
          });
          fetchBookings();
        } else {
          toast.error("Failed to update booking status");
        }
      })
      .finally(() => {
        busy.current = false;
        setUpdatingKey(null);
      });
  };

  // Search: a number is a booking ID, anything else is a booker name.
  const matchesSearch = (b) => {
    const raw = query.trim().replace(/^#/, "");
    if (!raw) return true;
    if (/^\d+$/.test(raw)) return String(b.booking_id).includes(raw);
    return allWordsIn(raw, b.username, b.full_name);
  };
  const searched = bookings.filter(matchesSearch);

  // Tab counts reflect the current search, so they show what each tab
  // would contain.
  const counts = {
    All: searched.length,
    Pending: searched.filter((b) => b.status === "Pending").length,
    Confirmed: searched.filter((b) => b.status === "Confirmed").length,
    Cancelled: searched.filter((b) => b.status === "Cancelled").length,
  };

  const filteredBookings =
    statusFilter === "All"
      ? searched
      : searched.filter((b) => b.status === statusFilter);

  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfFirstBooking = (safePage - 1) * bookingsPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfFirstBooking + bookingsPerPage,
  );

  const STATUS_TABS = ["All", "Pending", "Confirmed", "Cancelled"];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Manage Bookings
      </h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setCurrentPage(1);
          }}
          placeholder="Search booking ID or booker name"
        />
        <div
          role="group"
          aria-label="Filter by status"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={statusFilter === tab}
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                statusFilter === tab
                  ? "border-lagoon bg-lagoon text-sand-light"
                  : "border-ink/10 bg-white text-ink/70 hover:border-ink/20",
              )}
            >
              {tab}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  statusFilter === tab ? "bg-white/25" : "bg-sand text-ink/60",
                )}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3 font-medium">Booking ID</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Resort</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentBookings.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-ink/50">
                  {query || statusFilter !== "All"
                    ? "No bookings match your search or filter."
                    : "No bookings found."}
                </td>
              </tr>
            ) : (
              currentBookings.map((booking) => (
                <tr
                  key={booking.booking_id}
                  className="border-b border-ink/5 last:border-0"
                >
                  <td className="px-4 py-3">{booking.booking_id}</td>
                  <td className="px-4 py-3">
                    {booking.username}
                    {booking.full_name &&
                      booking.full_name !== booking.username && (
                        <span className="block text-xs text-ink/50">
                          {booking.full_name}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3">{booking.resort_name}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {booking.check_in_display} to {booking.check_out_display}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/adminDashboard/bookingDetails/${booking.booking_id}`,
                          )
                        }
                      >
                        View
                      </Button>

                      {booking.status === "Refund Requested" ? (
                        <span className="self-center text-xs text-ink/50">
                          See the Refund Requests tab
                        </span>
                      ) : (
                        <>
                          <LoadingButton
                            variant="secondary"
                            size="sm"
                            loading={
                              updatingKey === `${booking.booking_id}:Confirmed`
                            }
                            disabled={
                              booking.status === "Confirmed" || !!updatingKey
                            }
                            onClick={() => {
                              if (!booking.payment_ready) {
                                Swal.fire({
                                  icon: "warning",
                                  title: "Payment not completed",
                                  text: "This booking has no successful payment or uploaded GCash receipt yet, so it can't be approved. The guest needs to pay via PayPal or upload a GCash receipt first.",
                                  confirmButtonColor: "#3e9c93",
                                });
                                return;
                              }
                              Swal.fire({
                                title: "Approve this booking?",
                                text: "This will mark the booking as Confirmed.",
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonColor: "#3e9c93",
                                cancelButtonColor: "#6b6259",
                                confirmButtonText: "Yes, approve it!",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  updateBookingStatus(
                                    booking.booking_id,
                                    "Confirmed",
                                  );
                                }
                              });
                            }}
                          >
                            Approve
                          </LoadingButton>
                          <LoadingButton
                            variant="ghost"
                            size="sm"
                            className="text-seal hover:bg-seal/10 hover:text-seal"
                            loading={
                              updatingKey === `${booking.booking_id}:Cancelled`
                            }
                            disabled={
                              booking.status === "Cancelled" || !!updatingKey
                            }
                            onClick={() => {
                              Swal.fire({
                                title: "Cancel this booking?",
                                text:
                                  booking.payment_method === "paypal"
                                    ? "This will mark the booking as Cancelled and automatically refund the PayPal payment."
                                    : "This will mark the booking as Cancelled.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#b23b2e",
                                cancelButtonColor: "#6b6259",
                                confirmButtonText: "Yes, cancel it!",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  updateBookingStatus(
                                    booking.booking_id,
                                    "Cancelled",
                                  );
                                }
                              });
                            }}
                          >
                            Cancel
                          </LoadingButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ManageBooking;
