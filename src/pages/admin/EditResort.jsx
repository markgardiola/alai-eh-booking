import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BARANGAYS } from "@/lib/barangays";
import { API_URL } from "../../../config";

const EditResort = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resortData, setResortData] = useState({
    name: "",
    barangay: "",
    address: "",
    location: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    rooms: [], // [{ id?, name, existingImages: [{id, image_url}], newImages: File[], newImagePreviews: string[] }]
    amenities: [],
  });

  // Existing gallery images already saved for this resort: [{ id, image_url }, ...]
  const [existingImages, setExistingImages] = useState([]);
  // Newly picked files not yet uploaded, plus their local preview URLs
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [loading, setLoading] = useState(true);

  // Stay types manage themselves independently of the main resort form --
  // each add/edit/delete hits the API immediately, same as Promo Codes.
  const [stayTypes, setStayTypes] = useState([]);
  const [stayTypeEditingId, setStayTypeEditingId] = useState(null); // null = dialog closed, "new" = creating, else editing that id
  const [stayTypeForm, setStayTypeForm] = useState({
    name: "",
    checkInTime: "",
    checkOutTime: "",
    spansNextDay: false,
    price: "",
  });
  const [runSave, saving] = useSingleFlight();
  const [runSaveStayType, savingStayType] = useSingleFlight();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchResort = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/resorts/${id}`);
        const data = res.data;

        setResortData({
          name: data.name,
          barangay: data.barangay || "",
          address: data.address || "",
          location: data.location || "",
          description: data.description,
          ownerName: data.owner_name || "",
          ownerEmail: data.owner_email || "",
          rooms: (data.rooms || []).map((room) => ({
            id: room.id,
            name: room.name,
            existingImages: room.images || [],
            newImages: [],
            newImagePreviews: [],
          })),
          amenities: data.amenities || [],
        });
        setExistingImages(data.images || []);
        setStayTypes(data.stayTypes || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load resort details.");
        setLoading(false);
      }
    };

    fetchResort();
  }, [id]);

  const handleChange = (e) => {
    setResortData({ ...resortData, [e.target.name]: e.target.value });
  };

  const fetchStayTypes = () => {
    axios
      .get(`${API_URL}/api/resorts/${id}/stay-types`)
      .then((res) => setStayTypes(res.data))
      .catch((err) => console.error("Error fetching stay types:", err));
  };

  const openAddStayType = () => {
    setStayTypeForm({
      name: "",
      checkInTime: "",
      checkOutTime: "",
      spansNextDay: false,
      price: "",
    });
    setStayTypeEditingId("new");
  };

  const openEditStayType = (stayType) => {
    setStayTypeForm({
      name: stayType.name,
      checkInTime: stayType.check_in_time,
      checkOutTime: stayType.check_out_time,
      spansNextDay: stayType.spans_next_day,
      price: stayType.price,
    });
    setStayTypeEditingId(stayType.id);
  };

  const saveStayType = async () => {
    try {
      if (stayTypeEditingId === "new") {
        await axios.post(
          `${API_URL}/api/resorts/${id}/stay-types`,
          stayTypeForm,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Stay type added!");
      } else {
        await axios.put(
          `${API_URL}/api/stay-types/${stayTypeEditingId}`,
          stayTypeForm,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Stay type updated!");
      }
      setStayTypeEditingId(null);
      fetchStayTypes();
    } catch (err) {
      console.error("Error saving stay type:", err);
      toast.error(err.response?.data?.message || "Failed to save stay type.");
    }
  };

  const handleSaveStayType = () => runSaveStayType(saveStayType);

  const handleDeleteStayType = (stayType) => {
    Swal.fire({
      title: `Delete "${stayType.name}"?`,
      text: "This removes it as a bookable option going forward.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (!result.isConfirmed) return;

      axios
        .delete(`${API_URL}/api/stay-types/${stayType.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          toast.success("Stay type deleted.");
          fetchStayTypes();
        })
        .catch((err) => {
          console.error("Error deleting stay type:", err);
          toast.error("Failed to delete stay type.");
        });
    });
  };

  const formatTime = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  const handleRoomNameChange = (index, value) => {
    const updatedRooms = [...resortData.rooms];
    updatedRooms[index] = { ...updatedRooms[index], name: value };
    setResortData({ ...resortData, rooms: updatedRooms });
  };

  const handleRoomImagesChange = (index, fileList) => {
    const files = Array.from(fileList);
    const updatedRooms = [...resortData.rooms];
    updatedRooms[index] = {
      ...updatedRooms[index],
      newImages: [...updatedRooms[index].newImages, ...files],
      newImagePreviews: [
        ...updatedRooms[index].newImagePreviews,
        ...files.map((file) => URL.createObjectURL(file)),
      ],
    };
    setResortData({ ...resortData, rooms: updatedRooms });
  };

  const removeRoomExistingImage = (roomIndex, imageId) => {
    const updatedRooms = [...resortData.rooms];
    updatedRooms[roomIndex] = {
      ...updatedRooms[roomIndex],
      existingImages: updatedRooms[roomIndex].existingImages.filter(
        (img) => img.id !== imageId,
      ),
    };
    setResortData({ ...resortData, rooms: updatedRooms });
  };

  const removeRoomNewImage = (roomIndex, imgIndex) => {
    const updatedRooms = [...resortData.rooms];
    updatedRooms[roomIndex] = {
      ...updatedRooms[roomIndex],
      newImages: updatedRooms[roomIndex].newImages.filter(
        (_, i) => i !== imgIndex,
      ),
      newImagePreviews: updatedRooms[roomIndex].newImagePreviews.filter(
        (_, i) => i !== imgIndex,
      ),
    };
    setResortData({ ...resortData, rooms: updatedRooms });
  };

  const handleAmenityChange = (index, value) => {
    const updatedAmenities = [...resortData.amenities];
    updatedAmenities[index] = value;
    setResortData({ ...resortData, amenities: updatedAmenities });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = ""; // allow picking the same file again after removing it
  };

  const removeExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addRoom = () => {
    setResortData({
      ...resortData,
      rooms: [
        ...resortData.rooms,
        { name: "", existingImages: [], newImages: [], newImagePreviews: [] },
      ],
    });
  };

  const removeRoom = (index) => {
    const updatedRooms = [...resortData.rooms];
    updatedRooms.splice(index, 1);
    setResortData({ ...resortData, rooms: updatedRooms });
  };

  const addAmenity = () => {
    setResortData({ ...resortData, amenities: [...resortData.amenities, ""] });
  };

  const removeAmenity = (index) => {
    const updatedAmenities = [...resortData.amenities];
    updatedAmenities.splice(index, 1);
    setResortData({ ...resortData, amenities: updatedAmenities });
  };

  const saveResort = async () => {
    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error("Please keep or add at least one image.");
      return;
    }

    if (!resortData.barangay) {
      toast.error("Please select a barangay.");
      return;
    }

    if (!resortData.address.trim()) {
      toast.error("Address is required.");
      return;
    }

    if (!resortData.ownerName || !resortData.ownerEmail) {
      toast.error("Resort owner name and email are required.");
      return;
    }

    if (resortData.rooms.some((room) => !room.name.trim())) {
      toast.error("Every room needs a name.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", resortData.name);
      formData.append("barangay", resortData.barangay);
      formData.append("address", resortData.address);
      formData.append("location", resortData.location);
      formData.append("description", resortData.description);
      formData.append("ownerName", resortData.ownerName);
      formData.append("ownerEmail", resortData.ownerEmail);
      formData.append(
        "rooms",
        JSON.stringify(
          resortData.rooms.map((room) => ({
            id: room.id,
            name: room.name,
            existingImages: room.existingImages.map((img) => img.image_url),
          })),
        ),
      );
      resortData.rooms.forEach((room, index) => {
        room.newImages.forEach((file) =>
          formData.append(`roomImages_${index}`, file),
        );
      });
      formData.append("amenities", JSON.stringify(resortData.amenities));

      formData.append(
        "existingImages",
        JSON.stringify(existingImages.map((img) => img.image_url)),
      );
      newImages.forEach((file) => formData.append("images", file));

      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/api/resorts/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Resort updated successfully!");
      navigate("/adminDashboard/resorts");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update resort.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSave(saveResort);
  };

  if (loading) return <div className="text-center text-ink/60">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link to="/adminDashboard/resorts">
        <Button variant="outline" size="sm" className="mb-6 gap-1.5">
          <ArrowLeft className="size-4" />
          Back to Listings
        </Button>
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">
        Edit Resort
      </h1>

      <form
        id="edit-resort-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="mt-6 flex flex-col gap-5"
      >
        <div>
          <label className="text-sm font-medium text-ink/80">Name</label>
          <Input
            type="text"
            name="name"
            value={resortData.name}
            onChange={handleChange}
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">Barangay</label>
          <select
            name="barangay"
            value={resortData.barangay}
            onChange={handleChange}
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
          <label className="text-sm font-medium text-ink/80">Address</label>
          <Input
            type="text"
            name="address"
            value={resortData.address}
            onChange={handleChange}
            placeholder="e.g. Purok 3, San Vicente, Sto. Tomas City, Batangas"
            required
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink/50">
            Shown to guests on the resort card.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">
            Location coordinates for Google Maps ways
          </label>
          <Input
            type="text"
            name="location"
            value={resortData.location}
            onChange={handleChange}
            placeholder="e.g. Purok 3, San Vicente, Sto. Tomas City, Batangas"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-ink/50">
            Paste coordinates (right-click the spot in Google Maps and click the
            coordinates numbers to copy) for an exact map. Short share links
            can't be used for the map preview.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80">Description</label>
          <textarea
            name="description"
            rows={4}
            value={resortData.description}
            onChange={handleChange}
            className="border-input mt-1.5 flex w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-ink/80">
              Resort Owner Name
            </label>
            <Input
              type="text"
              name="ownerName"
              value={resortData.ownerName}
              onChange={handleChange}
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/80">
              Resort Owner Email
            </label>
            <Input
              type="email"
              name="ownerEmail"
              value={resortData.ownerEmail}
              onChange={handleChange}
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
          <label className="text-sm font-medium text-ink/80">
            Resort Images
          </label>

          {existingImages.length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-ink/50">
                Current gallery (click × to remove):
              </p>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.image_url}
                      alt="Resort"
                      className="h-24 w-32 rounded-lg object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-seal text-white shadow"
                      title="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="border-input mt-2 flex w-full rounded-md border bg-white text-sm text-ink/60 file:mr-3 file:rounded-md file:border-0 file:bg-sand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
          />

          {newImagePreviews.length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-ink/50">New images to add:</p>
              <div className="flex flex-wrap gap-2">
                {newImagePreviews.map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      src={src}
                      alt={`New preview ${index}`}
                      className="h-24 w-32 rounded-lg object-cover shadow"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-seal text-white shadow"
                      title="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-ink/10 pt-5">
          <h2 className="font-display text-lg font-semibold text-ink">Rooms</h2>
          <p className="mt-1 text-xs text-ink/50">
            Listed for guests to see what's included -- no price or selection,
            since the whole resort is booked together.
          </p>
          <div className="mt-3 flex flex-col gap-4">
            {resortData.rooms.map((room, i) => (
              <div
                key={room.id ?? `new-${i}`}
                className="rounded-xl border border-ink/10 bg-sand-light p-3"
              >
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Room name"
                    value={room.name}
                    onChange={(e) => handleRoomNameChange(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-seal hover:bg-seal/10 hover:text-seal"
                    onClick={() => removeRoom(i)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {room.existingImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.existingImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.image_url}
                          alt={room.name}
                          className="h-16 w-20 rounded-lg object-cover shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeRoomExistingImage(i, img.id)}
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-seal text-white shadow"
                          title="Remove image"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {room.newImagePreviews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.newImagePreviews.map((src, imgIndex) => (
                      <div key={imgIndex} className="relative">
                        <img
                          src={src}
                          alt={`New ${room.name} preview`}
                          className="h-16 w-20 rounded-lg object-cover shadow"
                        />
                        <button
                          type="button"
                          onClick={() => removeRoomNewImage(i, imgIndex)}
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-seal text-white shadow"
                          title="Remove image"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleRoomImagesChange(i, e.target.files);
                    e.target.value = "";
                  }}
                  className="border-input mt-2 flex w-full rounded-md border bg-white text-xs text-ink/60 file:mr-3 file:rounded-md file:border-0 file:bg-sand file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-ink"
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5"
            onClick={addRoom}
          >
            <Plus className="size-4" />
            Add Room
          </Button>
        </div>

        <div className="border-t border-ink/10 pt-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Amenities
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {resortData.amenities.map((amenity, i) => (
              <div className="flex gap-2" key={i}>
                <Input
                  type="text"
                  value={amenity}
                  onChange={(e) => handleAmenityChange(i, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-seal hover:bg-seal/10 hover:text-seal"
                  onClick={() => removeAmenity(i)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5"
            onClick={addAmenity}
          >
            <Plus className="size-4" />
            Add Amenity
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-ink/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Stay Types & Pricing
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              Overnight, Day Tour, 21-Hour -- whatever packages this resort
              offers, each with its own times and price. Saved immediately,
              separate from the form above.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openAddStayType}>
            <Plus className="size-4" />
            Add Stay Type
          </Button>
        </div>

        {stayTypes.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No stay types yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {stayTypes.map((stayType) => (
              <div
                key={stayType.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-sand-light px-4 py-3"
              >
                <div>
                  <span className="font-medium text-ink">{stayType.name}</span>
                  <p className="text-sm text-ink/60">
                    {formatTime(stayType.check_in_time)} check-in →{" "}
                    {formatTime(stayType.check_out_time)}
                    {stayType.spans_next_day ? " (next day)" : ""} check-out
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lagoon-dark">
                    ₱{Number(stayType.price).toLocaleString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditStayType(stayType)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-seal hover:bg-seal/10 hover:text-seal"
                    onClick={() => handleDeleteStayType(stayType)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end border-t border-ink/10 pt-5">
        <LoadingButton
          type="submit"
          form="edit-resort-form"
          size="lg"
          loading={saving}
          loadingText="Saving changes..."
        >
          Update Resort
        </LoadingButton>
      </div>

      <Dialog
        open={!!stayTypeEditingId}
        onOpenChange={(open) => !open && setStayTypeEditingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stayTypeEditingId === "new" ? "Add Stay Type" : "Edit Stay Type"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-ink/80">Name</label>
              <div className="mt-1.5">
                <Input
                  value={stayTypeForm.name}
                  onChange={(e) =>
                    setStayTypeForm({ ...stayTypeForm, name: e.target.value })
                  }
                  placeholder="e.g. Overnight, Day Tour, 21-Hour Stay"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink/80">
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
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/80">
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
                  className="mt-1.5"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
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

            <div>
              <label className="text-sm font-medium text-ink/80">
                Price (₱)
              </label>
              <div className="mt-1.5">
                <Input
                  type="number"
                  min="0"
                  value={stayTypeForm.price}
                  onChange={(e) =>
                    setStayTypeForm({ ...stayTypeForm, price: e.target.value })
                  }
                  placeholder="Flat price for this package"
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setStayTypeEditingId(null)}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleSaveStayType}
                loading={savingStayType}
                loadingText="Saving..."
              >
                Save
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditResort;
