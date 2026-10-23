import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { User, Mail, Lock, Phone, MapPin } from "lucide-react";
import IconInput from "@/components/IconInput";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import { API_URL } from "../../config";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [user, setUser] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [runUpdate, updating] = useSingleFlight();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!token || !username || !email) {
      navigate("/signIn");
    } else {
      axios
        .get(`${API_URL}/api/get_user_info`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          const { username, email, phone, address } = res.data.user;
          setUser({
            username,
            email,
            phone: phone || "",
            address: address || "",
          });
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error loading profile data.");
        });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    if (!user.username || !user.email) {
      toast.error("Username and email are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (user.password && user.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const updatedUser = {
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };

    if (user.password && user.password.length >= 6) {
      updatedUser.password = user.password;
    }

    runUpdate(() =>
      axios
        .post(`${API_URL}/api/update_user`, updatedUser, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then((res) => {
          toast.success(res.data.message || "Profile updated successfully!");
          setIsEditing(false);
          setUser((prev) => ({ ...prev, password: "" }));
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error updating profile!");
        }),
    );
  };

  return (
    <div className="min-h-screen bg-sand-light px-4 pt-28 pb-16 sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center font-display text-3xl font-semibold text-ink">
          My Profile
        </h1>

        <div className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Username
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={User}
                    type="text"
                    name="username"
                    value={user.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">Email</label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Mail}
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  New Password
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Lock}
                    type="password"
                    name="password"
                    placeholder="Leave blank to keep current password"
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Mobile
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Phone}
                    type="text"
                    name="phone"
                    value={user.phone || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Address
                </label>
                <div className="relative mt-1.5">
                  <MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-ink/40" />
                  <textarea
                    name="address"
                    value={user.address || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="border-input flex w-full min-w-0 rounded-md border bg-white py-2 pl-9 pr-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={updating}
                  loadingText={"Saving..."}
                >
                  Save Changes
                </LoadingButton>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <User className="size-5 shrink-0 text-lagoon-dark" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    Username
                  </p>
                  <p className="text-base text-ink">{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="size-5 shrink-0 text-lagoon-dark" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    Email
                  </p>
                  <p className="text-base text-ink">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Lock className="size-5 shrink-0 text-lagoon-dark" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    Password
                  </p>
                  <p className="text-base text-ink">**********</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="size-5 shrink-0 text-lagoon-dark" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    Mobile
                  </p>
                  <p className="text-base text-ink">
                    {user.phone || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="size-5 shrink-0 text-lagoon-dark" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink/50">
                    Address
                  </p>
                  <p className="text-base text-ink">
                    {user.address || "Not available"}
                  </p>
                </div>
              </div>

              <Button className="mt-2" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
