import React from "react";
import Link from "next/link";
import BackgroundImage from "./BackgroundImage";

export default function HeroSection() {
  return (
    <BackgroundImage
      src="/images/landscapeBackground.png"
      alt="Utah landscape background"
      className="min-h-[80vh] w-full flex flex-col items-center justify-center relative overflow-hidden"
      priority={true}
      quality={85}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-10" />

      {/* Hero Content */}
      <div className="relative z-20 text-center p-4 sm:p-6 md:p-8 bg-black/30 rounded-xl max-w-4xl mx-auto backdrop-blur-sm border border-white/10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl leading-tight">
          Welcome to Nomadic Performance
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 font-medium drop-shadow-lg leading-relaxed max-w-3xl mx-auto">
          Helping outdoor athletes and adventurers stay strong, prevent injuries, and perform at their best—anywhere, anytime.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/blog"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-[#1a3a2a] bg-white rounded-full no-underline shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-gray-50"
          >
            Explore the Blog
          </Link>
        </div>
      </div>

      {/* SVG Mountain Accent */}
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 left-0 w-full h-24 sm:h-32 z-20"
      >
        <path
          fill="#1a3a2a"
          fillOpacity="0.8"
          d="M0,224L60,192C120,160,240,96,360,101.3C480,107,600,181,720,218.7C840,256,960,256,1080,229.3C1200,203,1320,149,1380,122.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
    </BackgroundImage>
  );
}
