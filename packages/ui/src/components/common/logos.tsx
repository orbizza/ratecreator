"use client";

import Image from "next/image";

export const RateCreatorLogo = () => {
  return (
    <div className='w-5 h-5 relative'>
      <Image src='/logo.svg' alt='Logo' fill className='object-contain' />
    </div>
  );
};
