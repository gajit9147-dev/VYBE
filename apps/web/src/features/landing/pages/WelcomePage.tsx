import React, { useEffect } from "react";
import { WelcomeHero } from "../components/WelcomeHero";
import { WelcomeVisual } from "../components/WelcomeVisual";
import { GlowOrb } from "@/components/layout/GlowOrb";

export const WelcomePage: React.FC = () => {
  useEffect(() => {
    document.title = "VYBE — Real People. Meaningful Connections.";
  }, []);

  return (
    <div className="relative w-full py-6 sm:py-10 md:py-14 lg:py-20 flex flex-col justify-center min-h-[calc(100vh-10rem)]">
      {/* Subtle Background Glow behind WelcomeVisual on Desktop */}
      <div
        className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none z-0"
        aria-hidden="true"
      >
        <GlowOrb color="purple" size="xl" className="opacity-40" />
      </div>

      {/* Two-Column Responsive Grid */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-14 items-center">
        {/* Left Column: Hero Content, Brand, CTAs */}
        <section className="lg:col-span-7 flex justify-center lg:justify-start">
          <WelcomeHero />
        </section>

        {/* Right Column: Visual Preview Card */}
        <section className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <WelcomeVisual />
        </section>
      </div>
    </div>
  );
};
