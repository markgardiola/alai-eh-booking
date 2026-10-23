import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Users,
  Baby,
  Images,
  Clock,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import BookingSteps from "@/components/BookingSteps";
import StayTypeCalendar from "@/components/StayTypeCalendar";
import RoomPreviewDialog from "@/components/RoomPreviewDialog";
import IconInput from "@/components/IconInput";
import { cn } from "@/lib/utils";
import { API_URL } from "../../config";

const pad = (n) => String(n).padStart(2, "0");

// Pure calendar-day arithmetic on a "YYYY-MM-DD" string, done via
// Date.UTC as an internal calculator only (built and read with UTC
// methods, never mixed with local time or serialized) -- avoids the
// timezone drift that caused the earlier calendar bug.
const addDaysISO = (isoDateStr, days) => {
  const [y, m, d] = isoDateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

const formatTime12h = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${pad(m)} ${period}`;
};

const formatDateLong = (isoDateStr) => {
  const [y, m, d] = isoDateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Booking = () => {
  const { resortId } = useParams();
  const navigate = useNavigate();
  const [resort, setResort] = useState(null);
  const [runBooking, submitting] = useSingleFlight();
  const [bookedBookings, setBookedBookings] = useState([]);
  const [previewRoom, setPreviewRoom] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    address: "",
    stayTypeId: "",
    date: "",
    adults: 1,
    children: 0,
  });

  const fetchBookedDates = () => {
    axios
      .get(`${API_URL}/api/resorts/${resortId}/booked-dates`)
      .then((res) => setBookedBookings(res.data))
      .catch((err) =>
        console.error("Error fetching resort availability:", err),
      );
  };

  useEffect(() => {
    fetchBookedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resortId]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/resorts/${resortId}`)
      .then((response) => setResort(response.data))
      .catch((error) => console.error("Error fetching resort details:", error));

    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    if (email) {
      setForm((prevForm) => ({ ...prevForm, email }));

      axios
        .get(`${API_URL}/api/get_user_info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          const { username, phone, address } = res.data.user;
          setForm((prevForm) => ({
            ...prevForm,
            fullName: username || "",
            mobile: phone || "",
            address: address || "",
          }));
        })
        .catch((err) =>
          console.error("Error fetching user info from DB:", err),
        );
    }
  }, [resortId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const selectedStayType = resort?.stayTypes?.find(
    (st) => String(st.id) === String(form.stayTypeId),
  );

  const handleSelectStayType = (stayTypeId) => {
    // Availability differs per stay type (different times, different
    // buffer windows), so any previously picked date may no longer be
    // valid -- clear it rather than silently carry it over.
    setForm((prev) => ({ ...prev, stayTypeId, date: "" }));
  };

  const totalPrice = selectedStayType ? Number(selectedStayType.price) : 0;

  // The actual check-out calendar date, accounting for stay types that
  // end the next day (e.g. Overnight) vs. the same day (e.g. Day Tour).
  const checkOutDate =
    form.date && selectedStayType
      ? selectedStayType.spans_next_day
        ? addDaysISO(form.date, 1)
        : form.date
      : "";

  const handleBooking = (e) => {
    e.preventDefault();

    if (!form.stayTypeId) {
      toast.error("Please select a stay type.");
      return;
    }
    if (!form.date) {
      toast.error("Please select a date.");
      return;
    }

    const token = localStorage.getItem("token");

    runBooking(() =>
      axios
        .post(
          `${API_URL}/api/book`,
          {
            resortId: resort.id,
            stayTypeId: form.stayTypeId,
            date: form.date,
            fullName: form.fullName,
            email: form.email,
            mobile: form.mobile,
            address: form.address,
            adults: form.adults,
            children: form.children,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .then((res) => {
          localStorage.setItem("bookingId", res.data.bookingId);
          toast.success("Booking request submitted!");
          navigate("/payment");
        })
        .catch((err) => {
          console.error("Booking failed:", err);
          toast.error(
            err.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
          if (err.response?.status === 409) {
            // Someone else grabbed this slot between page load and submit --
            // refresh the calendar and make them pick again.
            fetchBookedDates();
            setForm((prev) => ({ ...prev, date: "" }));
          }
        }),
    );
  };

  if (!resort)
    return (
      <div className="pt-32 pb-16 text-center text-ink/60">Loading...</div>
    );

  return (
    <div className="min-h-screen bg-sand-light px-4 pt-28 pb-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <BookingSteps current={2} />

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
          <h1 className="text-center font-display text-3xl font-semibold text-ink">
            {resort.name}
          </h1>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              {resort.images?.length > 0 ? (
                <Carousel className="rounded-xl">
                  <CarouselContent>
                    {resort.images.map((img) => (
                      <CarouselItem key={img.id}>
                        <img
                          src={img.image_url}
                          alt="Resort"
                          className="block h-64 w-full rounded-xl object-cover"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <img
                  src={resort.image}
                  alt="Resort"
                  className="h-64 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Description
              </h3>
              <p className="mt-1 text-sm text-ink/70">{resort.description}</p>

              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                Amenities
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {resort.amenities?.map((item, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-sand px-3 py-1 text-xs text-ink/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleBooking}
            className="mt-8 border-t border-ink/10 pt-8"
          >
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">
              Book Your Stay
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Full Name
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={User}
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Email Address
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Mail}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Mobile Number
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Phone}
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Address
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={MapPin}
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {resort.rooms && resort.rooms.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-ink/80">
                  Rooms Included in Your Stay
                </label>
                <p className="mt-1 text-xs text-ink/50">
                  This is a private resort -- your whole stay includes every
                  room below.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {resort.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between rounded-xl border border-ink/10 bg-sand-light px-4 py-2.5"
                    >
                      <span className="font-medium text-ink">{room.name}</span>
                      <Button
                        type="button"
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
              </div>
            )}

            {resort.stayTypes && resort.stayTypes.length > 0 ? (
              <>
                <div className="mt-4">
                  <label className="text-sm font-medium text-ink/80">
                    Choose a Stay Type
                  </label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {resort.stayTypes.map((stayType) => {
                      const isSelected =
                        String(stayType.id) === String(form.stayTypeId);
                      return (
                        <button
                          key={stayType.id}
                          type="button"
                          onClick={() => handleSelectStayType(stayType.id)}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "border-lagoon bg-lagoon/10"
                              : "border-ink/10 bg-sand-light hover:border-lagoon/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-ink">
                              {stayType.name}
                            </span>
                            <span className="font-display text-lagoon-dark">
                              ₱{Number(stayType.price).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/60">
                            <Clock className="size-3.5" />
                            {formatTime12h(stayType.check_in_time)} check-in →{" "}
                            {formatTime12h(stayType.check_out_time)}
                            {stayType.spans_next_day ? " (next day)" : ""}{" "}
                            check-out
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-ink/80">
                    Select Date
                  </label>
                  <div className="mt-1.5">
                    <StayTypeCalendar
                      bookedBookings={bookedBookings}
                      stayType={selectedStayType}
                      value={form.date}
                      onChange={(date) =>
                        setForm((prev) => ({ ...prev, date }))
                      }
                    />
                  </div>
                  {form.date && selectedStayType && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/70">
                      <CalendarDays className="size-4 text-lagoon-dark" />
                      {formatDateLong(form.date)}{" "}
                      {formatTime12h(selectedStayType.check_in_time)} →{" "}
                      {formatDateLong(checkOutDate)}{" "}
                      {formatTime12h(selectedStayType.check_out_time)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-ink/15 p-4 text-sm text-ink/60">
                This resort hasn't set up any stay type packages yet. Please
                check back later or contact the resort.
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Adults
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Users}
                    type="number"
                    name="adults"
                    value={form.adults}
                    min="1"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Children
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Baby}
                    type="number"
                    name="children"
                    value={form.children}
                    min="0"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {selectedStayType && (
              <div className="mt-5 rounded-xl bg-sand-light px-4 py-3">
                <div className="flex items-center justify-between text-sm text-ink/70">
                  <span>{selectedStayType.name}</span>
                  <span className="font-display text-lg font-semibold text-lagoon-dark">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <LoadingButton
              type="submit"
              size="lg"
              className="mt-6 w-full"
              loading={submitting}
              loadingText="Submitting..."
            >
              Confirm Booking
            </LoadingButton>
          </form>
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

export default Booking;
