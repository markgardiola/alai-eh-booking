import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import { API_URL } from "../../config";

const OwnerSignIn = () => {
  const [values, setValues] = useState({ email: "", password: "" });
  const [runSignIn, signingIn] = useSingleFlight();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSignIn(() =>
      axios
        .post(`${API_URL}/api/owner-login`, values)
        .then((res) => {
          if (res.data.token && res.data.user) {
            const { token, user } = res.data;

            localStorage.setItem("token", token);
            localStorage.setItem("username", user.username);
            localStorage.setItem("email", user.email);
            localStorage.setItem("role", user.role);

            toast.success(res.data.success, {
              position: "top-right",
              autoClose: 3000,
            });

            navigate("/owner");
          } else {
            toast.error("Invalid server response.", {
              position: "top-right",
              autoClose: 3000,
            });
          }
        })
        .catch((err) => {
          console.log("Login error:", err);

          if (err.response?.data?.message) {
            toast.error(err.response.data.message, {
              position: "top-right",
              autoClose: 3000,
            });
          } else if (err.message === "Network Error") {
            toast.error("Unable to connect to the server.", {
              position: "top-right",
              autoClose: 3000,
            });
          } else {
            toast.error("An unexpected error occurred.", {
              position: "top-right",
              autoClose: 3000,
            });
          }
        }),
    );
  };

  return (
    <AuthShell
      variant="ink"
      eyebrow="Resort owner access"
      title="See your bookings, reviews, and revenue."
      subtitle="This area is for ALAI-eh's listed resort owners."
    >
      <h1 className="font-display text-3xl font-semibold text-ink">
        Owner Sign In
      </h1>
      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4"
        autoComplete="off"
      >
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink/80">
            Email
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            onChange={handleChange}
            className="mt-1.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink/80"
            >
              Password
            </label>
          </div>
          <div className="mt-1.5">
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              onChange={handleChange}
            />
            <Link
              to="/owner/forgot-password"
              className="text-sm font-medium text-lagoon-dark hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="mt-2 w-full"
          loading={signingIn}
          loadingText={"Signing in..."}
        >
          Sign In
        </LoadingButton>

        <p className="text-center text-xs text-ink/50">
          New here? Your account was created automatically and emailed to you
          when your resort was listed.
        </p>

        <Link
          to="/signIn"
          className="text-center text-sm font-medium text-lagoon-dark hover:underline"
        >
          ← Back to customer sign in
        </Link>
      </form>
    </AuthShell>
  );
};

export default OwnerSignIn;
