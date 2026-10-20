import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import { API_URL } from "../../../config";

const ManageBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      });
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking,
  );
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Manage Bookings
      </h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
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
                  No bookings found.
                </td>
              </tr>
            ) : (
              currentBookings.map((booking) => (
                <tr
                  key={booking.booking_id}
                  className="border-b border-ink/5 last:border-0"
                >
                  <td className="px-4 py-3">{booking.booking_id}</td>
                  <td className="px-4 py-3">{booking.username}</td>
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
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={booking.status === "Confirmed"}
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
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-seal hover:bg-seal/10 hover:text-seal"
                            disabled={booking.status === "Cancelled"}
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
                          </Button>
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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ManageBooking;
