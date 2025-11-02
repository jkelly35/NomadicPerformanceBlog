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
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/50 z-10" />

      {/* Hero Content */}
      <div className="relative z-30 text-center p-4 sm:p-6 md:p-8 bg-black/40 rounded-xl max-w-4xl mx-auto backdrop-blur-md border border-white/20 shadow-2xl">
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
            aria-label="Navigate to the blog page to read articles about performance training and outdoor activities"
            className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-[#1a3a2a] bg-white rounded-full no-underline shadow-xl hover:shadow-2xl focus:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:scale-105 hover:bg-gray-50 focus:bg-gray-50 border-2 border-white/20 focus:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/30 cursor-pointer"
          >
            <span className="relative z-10">Explore the Blog</span>
            <svg
              className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-focus:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* SVG Mountain Accent */}
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 left-0 w-full h-16 sm:h-20 z-10"
      >
        <path
          fill="#1a3a2a"
          fillOpacity="0.6"
          d="M0,256L60,240C120,224,240,192,360,181.3C480,171,600,181,720,197.3C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
    </BackgroundImage>
  );
}
