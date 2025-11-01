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
      <div className="absolute inset-0 bg-white/15 z-10" />

      {/* Hero Content */}
      <div className="relative z-20 text-center p-8 bg-black/40 rounded-lg max-w-2xl mx-auto backdrop-blur-sm">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-6 drop-shadow-2xl leading-tight">
          Welcome to Nomadic Performance
        </h1>
        <p className="text-lg md:text-xl text-white mb-8 font-medium drop-shadow-lg leading-relaxed">
          Helping outdoor athletes and adventurers stay strong, prevent injuries, and perform at their best—anywhere, anytime.
        </p>
        <Link
          href="/blog"
          className="inline-block px-8 py-3 text-lg font-bold text-[#1a3a2a] bg-white rounded-full no-underline shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Explore the Blog
        </Link>
      </div>

      {/* SVG Mountain Accent */}
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 left-0 w-full h-32 z-20"
      >
        <path
          fill="#1a3a2a"
          fillOpacity="0.7"
          d="M0,224L60,192C120,160,240,96,360,101.3C480,107,600,181,720,218.7C840,256,960,256,1080,229.3C1200,203,1320,149,1380,122.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
    </BackgroundImage>
  );
}
