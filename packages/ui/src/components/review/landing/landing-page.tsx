"use client";

import React from "react";
import { HeroSection } from "./hero-section"; // Import the HeroSection component

export const LandingPage = () => {
  return (
    <main className="min-h-[calc(100vh-20vh)] max-w-screen-xl mt-12  mx-auto">
      <HeroSection />
    </main>
  );
};
