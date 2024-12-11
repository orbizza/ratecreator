"use client";

import React from "react";
import { ShortcutErrorHome } from "./shortcut-home-error";

interface ErrorMessageProps {
  code?: number;
}

export const ErrorMessage = ({ code }: ErrorMessageProps) => {
  let title = "500 | Ooops!";
  let description = "Something isn't right.";

  if (code === 404) {
    title = "404 | Not Found";
    description = "This page doesn't exist.";
  }
  return (
    <div className='min-h-[calc(100vh-20vh)] flex flex-col items-center justify-center mx-auto max-w-screen-sm md:max-w-screen-lg lg:max-w-screen-2xl '>
      <h1 className='text-4xl md:text-7xl mb-20'>{title}</h1>
      <ShortcutErrorHome />
      <p className='text-neutral-600'>{description}</p>
    </div>
  );
};
