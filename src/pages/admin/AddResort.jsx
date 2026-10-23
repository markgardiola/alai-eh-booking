import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BARANGAYS } from "@/lib/barangays";
import { API_URL } from "../../../config";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";

const AddResort = () => {
  const [name, setName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [rooms, setRooms] = useState([]); // [{ name, images: File[] }]
  const [roomName, setRoomName] = useState("");
  const [roomImages, setRoomImages] = useState([]);
  const [roomFileInputKey, setRoomFileInputKey] = useState(0);

  const [amenities, setAmenities] = useState([]);
  const [amenityInput, setAmenityInput] = useState("");

  const [stayTypes, setStayTypes] = useState([]); // [{ name, checkInTime, checkOutTime, spansNextDay, price }]
  const [stayTypeForm, setStayTypeForm] = useState({
    name: "",
    checkInTime: "",
    checkOutTime: "",
    spansNextDay: false,
    price: "",
  });

  const [runSubmit, submitting] = useSingleFlight();

  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleAddAmenity = () => {
    if (!amenityInput.trim()) return;
    setAmenities([...amenities, amenityInput.trim()]);
    setAmenityInput("");
  };

  const handleRemoveAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleAddRoom = () => {
    if (!roomName) return;
    setRooms([...rooms, { name: roomName, images: roomImages }]);
    setRoomName("");
    setRoomImages([]);
    setRoomFileInputKey((k) => k + 1); // remounts the file input so it visually clears
  };

  const handleRemoveRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  const handleAddStayType = () => {
    if (
      !stayTypeForm.name ||
      !stayTypeForm.checkInTime ||
      !stayTypeForm.checkOutTime ||
      !stayTypeForm.price
    ) {
      return;
    }
    setStayTypes([...stayTypes, stayTypeForm]);
    setStayTypeForm({
      name: "",
      checkInTime: "",
      checkOutTime: "",
      spansNextDay: false,
      price: "",
    });
  };

  const handleRemoveStayType = (index) => {
    setStayTypes(stayTypes.filter((_, i) => i !== index));
  };

  const submitResort = async () => {
    if (
      !name ||
      !barangay ||
      !address ||
      !description ||
      !ownerName ||
      !ownerEmail ||
      rooms.length === 0 ||
      images.length === 0 ||
      stayTypes.length === 0
    ) {
      setError(
        "Please fill all required fields (including resort owner name/email and nightly price) and add at least one image, one room, and one stay type.",
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("barangay", barangay);
      formData.append("address", address);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("ownerName", ownerName);
      formData.append("ownerEmail", ownerEmail);

      images.forEach((img) => formData.append("images", img));

      formData.append(
        "rooms",
        JSON.stringify(rooms.map((room) => ({ name: room.name }))),
      );
      rooms.forEach((room, index) => {
        room.images.forEach((file) =>
          formData.append(`roomImages_${index}`, file),
        );
      });

      formData.append("amenities", JSON.stringify(amenities));
      formData.append("stayTypes", JSON.stringify(stayTypes));

      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/add_resort`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Resort added successfully!");
      navigate("/adminDashboard/resorts");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error adding resort. Please try again.",
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSubmit(submitResort);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/adminDashboard/resorts">
        <Button variant="outline" size="sm" className="mb-6 gap-1.5">
          <ArrowLeft className="size-4" />
          Back to Listings
        </Button>
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">
        Add New Resort
      </h1>

      {error && (
        <div className="mt-4 rounded-lg bg-seal/10 px-4 py-3 text-sm text-seal">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="mt-6 flex flex-col gap-5"
      >
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink/80">
            Resort Name
          </label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="barangay" className="text-sm font-medium text-ink/80">
            Barangay
          </label>
          <select
            id="barangay"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            required
            className="border-input mt-1.5 flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="">-- Select barangay --</option>
            {BARANGAYS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/50">
            This is what groups resorts under the same destination card --
            picking an existing barangay adds this resort to its card, a
            barangay with no resorts yet gets a new card automatically.
          </p>
        </div>

        <div>
          <label htmlFor="address" className="text-sm font-medium text-ink/80">
            Address
          </label>
          <Input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Purok 3, San Vicente, Sto. Tomas City, Batangas"
            required
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink/50">
            Shown to guests on the resort card.
          </p>
        </div>

        <div>
          <label htmlFor="location" className="text-sm font-medium text-ink/80">
            Map Pin (optional)
          </label>
          <Input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location coordinates like 14.0822,121.1397"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink/50">
            Paste coordinates (right-click the spot in Google Maps and click the
            coordinates numbers to copy) for an exact map. Short share links
            can't be used for the map preview.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-sm font-medium text-ink/80"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="border-input mt-1.5 flex w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="ownerName"
              className="text-sm font-medium text-ink/80"
            >
              Resort Owner Name
            </label>
            <Input
              type="text"
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <label
              htmlFor="ownerEmail"
              className="text-sm font-medium text-ink/80"
            >
              Resort Owner Email
            </label>
            <Input
              type="email"
              id="ownerEmail"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              className="mt-1.5"
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-ink/50">
          The owner is emailed automatically whenever a booking at this resort
          is confirmed or cancelled.
        </p>

        <div>
          <label htmlFor="images" className="text-sm font-medium text-ink/80">
            Resort Images
          </label>
          <input
            type="file"
            id="images"
            accept="image/*"
            onChange={handleImageChange}
            multiple
            required
            className="border-input mt-1.5 flex w-full rounded-md border bg-white text-sm text-ink/60 file:mr-3 file:rounded-md file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
          />
          {imagePreviews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {imagePreviews.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Preview ${index}`}
                  className="h-24 w-32 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">Amenities</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              type="text"
              placeholder="Amenity (e.g. Pool, WiFi)"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddAmenity}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-sm text-ink/80"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="text-ink/40 hover:text-seal"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">Rooms</label>
          <p className="mt-1 text-xs text-ink/50">
            Listed for guests to see what's included -- no price or selection,
            since the whole resort is booked together.
          </p>
          <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Room Name (e.g. Master Bedroom)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            <input
              key={roomFileInputKey}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setRoomImages(Array.from(e.target.files))}
              className="border-input flex h-9 w-full shrink-0 items-center rounded-md border bg-white text-sm text-ink/60 file:mr-3 file:h-full file:rounded-md file:border-0 file:bg-sand file:px-3 file:text-sm file:font-medium file:text-ink sm:w-64"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddRoom}
              className="shrink-0"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {rooms.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {rooms.map((room, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-ink/10 bg-sand-light px-4 py-2.5"
                >
                  <span className="text-sm text-ink">
                    {room.name} · {room.images.length} photo
                    {room.images.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(index)}
                    className="text-ink/40 hover:text-seal"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">
            Stay Types & Pricing
          </label>
          <p className="mt-1 text-xs text-ink/50">
            Overnight, Day Tour, 21-Hour -- whatever packages this resort
            offers, each with its own times and price. At least one is required.
          </p>

          <div className="mt-2 rounded-xl border border-ink/10 bg-sand-light p-3">
            <Input
              type="text"
              placeholder="Name (e.g. Overnight, Day Tour, 21-Hour Stay)"
              value={stayTypeForm.name}
              onChange={(e) =>
                setStayTypeForm({ ...stayTypeForm, name: e.target.value })
              }
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-ink/60">
                  Check-in Time
                </label>
                <Input
                  type="time"
                  value={stayTypeForm.checkInTime}
                  onChange={(e) =>
                    setStayTypeForm({
                      ...stayTypeForm,
                      checkInTime: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60">
                  Check-out Time
                </label>
                <Input
                  type="time"
                  value={stayTypeForm.checkOutTime}
                  onChange={(e) =>
                    setStayTypeForm({
                      ...stayTypeForm,
                      checkOutTime: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={stayTypeForm.spansNextDay}
                onChange={(e) =>
                  setStayTypeForm({
                    ...stayTypeForm,
                    spansNextDay: e.target.checked,
                  })
                }
                className="accent-lagoon"
              />
              Check-out happens the next day (overnight-style)
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Price (₱)"
                value={stayTypeForm.price}
                onChange={(e) =>
                  setStayTypeForm({ ...stayTypeForm, price: e.target.value })
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddStayType}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {stayTypes.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {stayTypes.map((stayType, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-ink/10 bg-sand-light px-4 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-ink">
                      {stayType.name}
                    </span>
                    <p className="text-xs text-ink/60">
                      {formatTime12h(stayType.checkInTime)} →{" "}
                      {formatTime12h(stayType.checkOutTime)}
                      {stayType.spansNextDay ? " (next day)" : ""} · ₱
                      {Number(stayType.price).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStayType(index)}
                    className="text-ink/40 hover:text-seal"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="mt-2"
          loading={submitting}
          loadingText="Uploading and saving..."
        >
          Save Resort
        </LoadingButton>
      </form>
    </div>
  );
};

export default AddResort;
