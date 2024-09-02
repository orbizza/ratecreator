"use client";

import React from "react";

import { ny } from "@ratecreator/ui/utils";

export function SphereMask({ reverse = false }: { reverse?: boolean }) {
  return (
    <div
      className={ny(
        // color
        "[--color:var(--color-one)]",
        "pointer-events-none relative -z-[2] mx-auto h-[50rem] overflow-hidden",

        // sphere mask
        "[mask-image:radial-gradient(ellipse_at_center_center,#000,transparent_50%)]",

        // reverse
        reverse ? "my-[-22rem] rotate-180 md:mt-[-30rem]" : "my-[-18.8rem]",

        // before
        "before:absolute before:inset-0 before:size-full before:opacity-40 before:[background-image:radial-gradient(circle_at_bottom_center,var(--color),transparent_70%)]",

        // after
        "after:bg-background after:absolute after:-left-1/2 after:top-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[50%] after:border-t after:border-[hsl(var(--border))]",
      )}
    ></div>
  );
}
