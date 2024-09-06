"use client";

import React, { useEffect, useState } from "react";
import { SphereMask } from "@ratecreator/ui";

import { StatsSection } from "./stats-section";
export function CataloguedStats() {
  const [isCataloguedVisible, setIsCataloguedVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsCataloguedVisible(true);
      }
    });

    const target = document.querySelector("#catalogued-section");
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, []);

  return (
    <section id='catalogued-section' className='mb-[16rem]'>
      <div
        className={`total-accounts w-full mt-0  p-8 transition-opacity duration-1000 ${
          isCataloguedVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {isCataloguedVisible && (
          <>
            <SphereMask />
            <StatsSection />
          </>
        )}
      </div>
    </section>
  );
}
