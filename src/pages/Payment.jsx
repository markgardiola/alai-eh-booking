import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  CalendarDays,
  BedDouble,
  Tag,
  X,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import { Input } from "@/components/ui/input";
import BookingSteps from "@/components/BookingSteps";
import { cn } from "@/lib/utils";
import { API_URL } from "../../config";

const Payment = () => {
  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState("paypal");

  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [runReceipt, submittingReceipt] = useSingleFlight();

  const [promoCode, setPromoCode] = useState("");
  const [runApplyPromo, applyingPromo] = useSingleFlight();
  const [runRemovePromo, removingPromo] = useSingleFlight();
  const [promoError, setPromoError] = useState("");

  const navigate = useNavigate();

  const gcashNumber = "0917-123-4567";
  const QrCode = "/images/QR_code.png";

  const bookingId = localStorage.getItem("bookingId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!bookingId) {
      navigate("/");
      return;
    }

    axios
      .get(`${API_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setBooking(res.data))
      .catch((err) => {
        console.error("Error fetching booking:", err);
        toast.error("Couldn't load your booking. Please try again.");
      });
  }, [bookingId, navigate, token]);

  const applyPromo = () => {
    if (!promoCode.trim()) return;

    runApplyPromo(async () => {
      setPromoError("");
      try {
        const res = await axios.post(
          `${API_URL}/api/bookings/${bookingId}/apply-promo`,
          { code: promoCode },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBooking((prev) => ({
          ...prev,
          promo_code: res.data.promoCode,
          discount_amount: res.data.discountAmount,
          total_price: res.data.totalPrice,
        }));
        toast.success("Promo code applied!");
      } catch (err) {
        console.error("Error applying promo code:", err);
        setPromoError(
          err.response?.data?.message || "Failed to apply promo code.",
        );
      }
    });
  };

  const removePromo = () =>
    runRemovePromo(async () => {
      try {
        const res = await axios.delete(
          `${API_URL}/api/bookings/${bookingId}/promo`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setBooking((prev) => ({
          ...prev,
          promo_code: null,
          discount_amount: 0,
          total_price: res.data.totalPrice,
        }));
        setPromoCode("");
        setPromoError("");
      } catch (err) {
        console.error("Error removing promo code:", err);
        toast.error("Failed to remove promo code.");
      }
    });

  const handleGcashSubmit = (e) => {
    e.preventDefault();

    if (!receipt) {
      toast.error("Please upload a receipt.");
      return;
    }

    runReceipt(async () => {
      try {
        const formData = new FormData();
        formData.append("receipt", receipt);
        formData.append("bookingId", bookingId);

        await axios.post(`${API_URL}/api/upload_receipt`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success("Receipt uploaded! We'll confirm your booking shortly.");
        localStorage.removeItem("bookingId");
        navigate("/myBooking");
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Failed to upload receipt. Try again.");
      }
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceipt(file);
    setPreview(URL.createObjectURL(file));
  };

  if (!booking) {
    return (
      <div className="pt-32 pb-16 text-center text-ink/60">
        Loading your booking...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-light px-4 pt-28 pb-16 sm:px-6">
      <div className="mx-auto max-w-lg">
        <BookingSteps current={3} />

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {/* Booking summary */}
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {booking.resort_name}
          </h1>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-ink/70">
            <CalendarDays className="size-4 text-lagoon-dark" />
            {booking.check_in_display} → {booking.check_out_display}
          </div>
          {booking.stay_type_name && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/70">
              <Tag className="size-4 text-lagoon-dark" />
              {booking.stay_type_name}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/70">
            <BedDouble className="size-4 text-lagoon-dark" />
            {booking.adults} adult{booking.adults > 1 ? "s" : ""}
            {booking.children > 0 &&
              `, ${booking.children} child${booking.children > 1 ? "ren" : ""}`}
          </div>

          <div className="mt-4 border-t border-ink/10 pt-4">
            {booking.promo_code ? (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-lagoon/10 px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-lagoon-dark">
                  <Tag className="size-4" />
                  <span className="font-medium">{booking.promo_code}</span>{" "}
                  applied
                </span>
                <button
                  onClick={removePromo}
                  disabled={removingPromo}
                  className="text-ink/50 hover:text-seal disabled:opacity-40"
                  aria-label="Remove promo code"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              booking.status === "Pending" && (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError("");
                      }}
                      placeholder="Promo code"
                      className="uppercase"
                    />
                    <LoadingButton
                      variant="outline"
                      onClick={applyPromo}
                      loading={applyingPromo}
                      loadingText="Applying..."
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </LoadingButton>
                  </div>
                  {promoError && (
                    <p className="mt-1.5 text-xs text-seal">{promoError}</p>
                  )}
                </div>
              )
            )}

            {Number(booking.discount_amount) > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-ink/60">
                  <span>Subtotal</span>
                  <span>
                    ₱{Number(booking.original_price).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-lagoon-dark">
                  <span>Discount</span>
                  <span>
                    -₱{Number(booking.discount_amount).toLocaleString()}
                  </span>
                </div>
              </>
            )}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ink/60">
                Total amount due
              </span>
              <span className="font-display text-2xl font-semibold text-lagoon-dark">
                ₱{Number(booking.total_price).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method toggle */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod("paypal")}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              method === "paypal"
                ? "border-lagoon bg-lagoon/10 text-lagoon-dark"
                : "border-ink/10 bg-white text-ink/60 hover:border-ink/20",
            )}
          >
            Pay with PayPal
          </button>
          <button
            onClick={() => setMethod("gcash")}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
              method === "gcash"
                ? "border-lagoon bg-lagoon/10 text-lagoon-dark"
                : "border-ink/10 bg-white text-ink/60 hover:border-ink/20",
            )}
          >
            Pay with GCash
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
          {method === "paypal" ? (
            <div>
              <p className="mb-4 text-sm text-ink/60">
                Pay securely with PayPal. Your booking is confirmed instantly
                once payment completes.
              </p>
              <PayPalScriptProvider
                options={{
                  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
                  currency: "PHP",
                }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", label: "pay" }}
                  createOrder={async () => {
                    try {
                      const res = await axios.post(
                        `${API_URL}/api/paypal/create-order`,
                        { bookingId },
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      return res.data.orderID;
                    } catch (err) {
                      console.error("Create order failed:", err);
                      toast.error(
                        err.response?.data?.message ||
                          "Couldn't start PayPal checkout.",
                      );
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      await axios.post(
                        `${API_URL}/api/paypal/capture-order`,
                        { orderID: data.orderID, bookingId },
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      toast.success(
                        "Payment successful! Your booking is confirmed.",
                      );
                      localStorage.removeItem("bookingId");
                      navigate("/myBooking");
                    } catch (err) {
                      console.error("Capture failed:", err);
                      toast.error(
                        "Payment could not be completed. Please try again.",
                      );
                    }
                  }}
                  onCancel={() => {
                    toast.info("Payment cancelled.");
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error(
                      "Something went wrong with PayPal. Please try again.",
                    );
                  }}
                />
              </PayPalScriptProvider>
            </div>
          ) : (
            <div>
              <p className="text-center text-sm text-ink/60">
                Account Number:{" "}
                <span className="font-medium text-ink">{gcashNumber}</span>
              </p>

              <div className="mt-4 flex justify-center">
                <img
                  src={QrCode}
                  alt="GCash QR Code"
                  className="w-full max-w-[220px] rounded-xl border border-ink/10"
                />
              </div>

              <form onSubmit={handleGcashSubmit} className="mt-6">
                <label className="text-sm font-medium text-ink/80">
                  Upload your payment receipt
                </label>

                <label
                  htmlFor="receipt"
                  className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-ink/25 bg-sand-light px-4 py-6 text-sm text-ink/60 transition-colors hover:border-lagoon hover:text-ink"
                >
                  <Upload className="size-4" />
                  {receipt ? receipt.name : "Choose an image file"}
                </label>
                <input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {preview && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-sm text-ink/60">
                      Receipt Preview:
                    </p>
                    <div className="flex justify-center">
                      <img
                        src={preview}
                        alt="Receipt Preview"
                        className="max-w-[260px] rounded-xl border border-ink/10"
                      />
                    </div>
                  </div>
                )}

                <p className="mt-4 text-xs text-ink/50">
                  GCash payments are verified manually -- your booking stays
                  "Pending" until an admin confirms your receipt.
                </p>

                <LoadingButton
                  type="submit"
                  size="lg"
                  className="mt-4 w-full"
                  loading={submittingReceipt}
                  loadingText="Uploading receipt..."
                >
                  Submit Receipt
                </LoadingButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
