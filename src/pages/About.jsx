import React from "react";
import { Quote } from "lucide-react";
import PageHero from "@/components/PageHero";
import WaveDivider from "@/components/WaveDivider";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="bg-sand-light">
      <PageHero eyebrow="Our story" title="About Us" />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Hi! We are Team ALAI-eh!
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/75">
              Welcome to ALAI-eh! We're your gateway to the Cities of Batangas,
              where life slows down, and connections grow deeper. Our passion is
              helping you find the perfect escape — a chance to step away from
              the daily grind, immerse yourself in nature's beauty, and cherish
              quality time with family and friends. We believe in the power of a
              good getaway to nurture the soul, strengthen relationships, and
              bring peace of mind. Join us as we celebrate life, one resort stay
              at a time!
            </p>

            <h2 className="mt-8 font-display text-3xl font-semibold text-ink">
              Aba'y Larga Na!
            </h2>
            <p className="mt-4 text-base text-ink/75">
              You can reach us anytime at{" "}
              <a
                href="mailto:alaehscape2025@gmail.com"
                className="font-medium italic text-lagoon-dark hover:underline"
              >
                alai.eh2526@gmail.com
              </a>
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-lagoon p-8 text-sand-light shadow-lg">
            <img
              src="/images/logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-14 -left-14 h-56 w-56 opacity-15 mix-blend-multiply select-none"
            />
            <Quote className="size-8 text-sand-light/70" />
            <p className="relative mt-4 font-display text-xl italic leading-relaxed">
              "Tumakas patungo sa paraiso, kung saan ang bawat alon ay
              bumubulong ng kapayapaan at ang bawat paglubog ng araw ay
              nagbibigay inspirasyon sa mga pangarap."
            </p>
          </div>
        </div>

        <WaveDivider className="mx-auto mt-16 h-6 w-full max-w-3xl opacity-20" />
      </section>

      <Footer />
    </div>
  );
};

export default About;
