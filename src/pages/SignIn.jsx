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

const SignIn = () => {
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
        .post(`${API_URL}/api/login`, {
          email: values.email,
          password: values.password,
        })
        .then((res) => {
          if (res.data.token && res.data.user) {
            const { token, user } = res.data;

            localStorage.setItem("token", token);
            localStorage.setItem("userId", user.id);
            localStorage.setItem("username", user.username);
            localStorage.setItem("email", user.email);
            localStorage.setItem("role", user.role);

            toast.success(res.data.success, {
              position: "top-right",
              autoClose: 3000,
            });

            navigate("/");
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
      eyebrow="Welcome back"
      title="Pick up right where you left off."
      subtitle="Sign in to manage your bookings and discover more in Sto. Tomas City."
    >
      <h1 className="font-display text-3xl font-semibold text-ink">Sign In</h1>
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
          <label htmlFor="password" className="text-sm font-medium text-ink/80">
            Password
          </label>
          <div className="mt-1.5">
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              onChange={handleChange}
            />
          </div>
          <div>
            <Link
              to="/forgotPassword"
              className="text-xs font-medium text-lagoon-dark hover:underline"
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
          loadingText="Signing in..."
        >
          Sign In
        </LoadingButton>

        <p className="text-center text-sm text-ink/60">
          Don't have an account yet?{" "}
          <Link
            to="/signUp"
            className="font-medium text-lagoon-dark hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default SignIn;
