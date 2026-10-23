import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { User, Mail, Phone } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import IconInput from "@/components/IconInput";
import OtpInput from "@/components/OtpInput";
import StepIndicator from "@/components/StepIndicator";
import { useCountdown } from "@/lib/useCountdown";
import {
  normalizePhilippinePhone,
  isValidPhilippinePhone,
} from "@/lib/phoneValidation";
import { API_URL } from "../../config";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";

const RESEND_COOLDOWN_SECONDS = 60;

const SignUp = () => {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [values, setValues] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [runRequestOtp, submitting] = useSingleFlight();
  const [runVerify, verifying] = useSingleFlight();
  const [runResend, resending] = useSingleFlight();

  const resendCooldown = useCountdown();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleRequestOtp = (e) => {
    e.preventDefault();

    if (!isValidPhilippinePhone(values.phone)) {
      toast.error(
        "Please enter a valid Philippine mobile number (e.g. 0917 123 4567).",
      );
      return;
    }

    runRequestOtp(() =>
      axios
        .post(`${API_URL}/api/register/request-otp`, values)
        .then(() => {
          toast.success("We sent a verification code to your phone.");
          setStep(2);
          resendCooldown.start(RESEND_COOLDOWN_SECONDS);
        })
        .catch((err) => {
          toast.error(
            err.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        }),
    );
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    runVerify(() =>
      axios
        .post(`${API_URL}/api/register/verify-otp`, {
          email: values.email,
          otp,
        })
        .then((res) => {
          const { token, user } = res.data;
          localStorage.setItem("token", token);
          localStorage.setItem("userId", user.id);
          localStorage.setItem("username", user.username);
          localStorage.setItem("email", user.email);
          localStorage.setItem("role", user.role);

          toast.success("Account verified! Welcome to ALAI-eh.");
          navigate("/");
        })
        .catch((err) => {
          toast.error(
            err.response?.data?.message || "Incorrect code. Please try again.",
          );
        }),
    );
  };

  const handleResend = () => {
    runResend(() =>
      axios
        .post(`${API_URL}/api/register/resend-otp`, { email: values.email })
        .then(() => {
          toast.success("A new code has been sent.");
          setOtp("");
          resendCooldown.start(RESEND_COOLDOWN_SECONDS);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Failed to resend code.");
        }),
    );
  };

  const maskedPhone = (() => {
    const normalized = normalizePhilippinePhone(values.phone);
    if (!normalized) return "";
    return `${normalized.slice(0, 4)}****${normalized.slice(-3)}`;
  })();

  return (
    <AuthShell
      eyebrow="Join us"
      title="Your next staycation starts here."
      subtitle="Create an account to book resorts, track reservations, and get booking updates by email."
    >
      <StepIndicator steps={["Your details", "Verify phone"]} current={step} />

      {step === 1 ? (
        <>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Sign Up
          </h1>
          <form
            onSubmit={handleRequestOtp}
            className="mt-6 flex flex-col gap-4"
            autoComplete="off"
          >
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-ink/80"
              >
                Full Name
              </label>
              <div className="mt-1.5">
                <IconInput
                  icon={User}
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your full name"
                  value={values.username}
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-ink/80"
              >
                Email
              </label>
              <div className="mt-1.5">
                <IconInput
                  icon={Mail}
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={values.email}
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-ink/80"
              >
                Mobile Number
              </label>
              <div className="mt-1.5">
                <IconInput
                  icon={Phone}
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="09XX XXX XXXX"
                  value={values.phone}
                  required
                  onChange={handleChange}
                />
              </div>
              <p className="mt-1 text-xs text-ink/50">
                We'll text you a code to verify this number.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-ink/80"
              >
                Password
              </label>
              <div className="mt-1.5">
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={values.password}
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <LoadingButton
              type="submit"
              size="lg"
              className="mt-2 w-full"
              loading={submitting}
              loadingText="Sending code..."
            >
              Continue
            </LoadingButton>

            <p className="text-center text-sm text-ink/60">
              Already have an account?{" "}
              <Link
                to="/signIn"
                className="font-medium text-lagoon-dark hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Verify Your Phone
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-ink">{maskedPhone}</span>.
          </p>

          <form onSubmit={handleVerifyOtp} className="mt-6 flex flex-col gap-5">
            <OtpInput value={otp} onChange={setOtp} disabled={verifying} />

            <LoadingButton
              type="submit"
              size="lg"
              className="w-full"
              loading={verifying}
              loadingText="Verifying..."
            >
              Verify & Create Account
            </LoadingButton>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-ink/60 hover:text-ink"
              >
                &larr; Edit details
              </button>

              {resendCooldown.isActive ? (
                <span className="text-ink/40">
                  Resend in {resendCooldown.seconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-lagoon-dark hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
};

export default SignUp;
