import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto bg-ink text-sand-light">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3 sm:items-start">
          <div>
            <p className="text-sm uppercase tracking-widest text-sand-light/50">
              Get in touch
            </p>
            <p className="mt-2 text-base text-sand-light/80">
              alai.eh2526@gmail.com
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <img
                src="/images/logo.png"
                alt=""
                className="h-8 w-8 rounded-full"
              />
              <span className="font-display text-xl font-semibold">
                ALAI-eh
              </span>
            </div>
            <p className="mt-2 text-sm text-sand-light/50">
              &copy; {new Date().getFullYear()} Team ALAI-eh. All rights
              reserved.
            </p>
          </div>

          <div className="flex justify-center sm:justify-end gap-2">
            <Link
              to="/adminSignIn"
              className="rounded-full border border-sand-light/30 px-4 py-2 text-sm tracking-wide text-sand-light/80 transition-colors hover:border-sand-light hover:text-sand-light"
            >
              Sign in as admin
            </Link>
            <Link
              to="/owner/login"
              className="rounded-full border border-sand-light/30 px-4 py-2 text-sm tracking-wide text-sand-light/80 transition-colors hover:border-sand-light hover:text-sand-light"
            >
              Sign in as owner
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
