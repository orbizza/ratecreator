"use client";

import { useTheme } from "next-themes";
import { ContactForm } from "./contact-form";
import { Spotlight, HeroHighlight, Highlight } from "@ratecreator/ui";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const ContactFormPage = () => {
  const { theme, resolvedTheme } = useTheme(); // `resolvedTheme` accounts for system theme automatically
  const [fill, setFill] = useState("");
  useEffect(() => {
    const loadTheme = () => {
      const selectedTheme = resolvedTheme || theme;
      const fill = selectedTheme === "dark" ? "white" : "black";
      setFill(fill);
    };
    loadTheme();
  }, [theme, resolvedTheme]);
  return (
    <div className="container max-h-[100vh-30px] mx-auto pt-20 p-6 flex flex-wrap justify-between">
      <div className="w-full  lg:w-1/2 mb-6 lg:mb-0 ">
        <HeroHighlight containerClassName="lg:rounded-none lg:rounded-tl-2xl lg:rounded-bl-2xl h-[44rem]">
          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: [20, -5, 0],
            }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0.0, 0.2, 1],
            }}
            className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
          >
            <span>
              <Highlight className="text-black dark:text-white">
                Rate Creator
              </Highlight>{" "}
              provides a platform to search and review creators.
            </span>
          </motion.h1>
        </HeroHighlight>
      </div>
      <div className="h-[44rem] rounded-2xl lg:rounded-none lg:rounded-tr-2xl lg:rounded-br-2xl  w-full flex justify-center lg:w-1/2 bg-white/[0.96] dark:bg-black/[0.96] antialiased bg-grid-black/[0.02] dark:bg-grid-white/[0.02] relative overflow-hidden m-auto p-6">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill={fill}
        />

        <ContactForm />
      </div>
    </div>
  );
};
