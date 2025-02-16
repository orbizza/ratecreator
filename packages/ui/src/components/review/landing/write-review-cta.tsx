"use client";

import React from "react";
import { cubicBezier, motion } from "framer-motion";
import { UsersRound } from "lucide-react";
import { formatValue } from "@ratecreator/db/utils";
import { useRouter } from "next/navigation";
export function WriteReviewCTA() {
  const router = useRouter();
  const variant1 = {
    initial: {
      y: 0,
      scale: 0.95,
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
    whileHover: {
      y: 10,
      x: 5,
      scale: 1,
      rotate: -2,
      boxShadow:
        "rgba(39,127,245,0.35) 0px 20px 70px -10px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
  };
  const variant2 = {
    initial: {
      y: 0,
      scale: 0.95,
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
    whileHover: {
      y: -37,
      x: -10,
      scale: 1,
      rotate: 3,
      boxShadow:
        "rgba(39,245,76,0.35) 0px 20px 70px -10px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
  };

  const variant3 = {
    initial: {
      y: 0,
      opacity: 0,
      scale: 0.95,
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
    whileHover: {
      y: 50,
      x: 20,
      opacity: 1,
      scale: 1,
      rotate: -4,
      boxShadow:
        "rgba(245,39,145,0.35) 0px 20px 70px -10px, rgba(36,42,66,0.04) 0px 10px 24px -8px, rgba(36,42,66,0.06) 0px 1px 4px -1px",
      transition: {
        delay: 0,
        duration: 0.2,
        ease: cubicBezier(0.22, 1, 0.36, 1),
      },
    },
  };

  const containerVariants = {
    initial: {},
    whileHover: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className='flex flex-col-reverse lg:flex-row justify-between items-center p-4 md:p-2 lg:p-0'>
      <div className='hidden sm:block relative h-full w-full lg:w-1/2  transform-gpu rounded-lg border bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] md:max-h-[500px]'>
        <motion.div
          variants={containerVariants}
          initial='initial'
          whileHover='whileHover'
          className='flex h-full w-full cursor-pointer flex-col items-start justify-between'
        >
          <div className='flex h-[350px] w-full items-center justify-center rounded-t-xl bg-transparent '>
            <div className='relative flex cursor-pointer flex-col items-center justify-center gap-y-2 p-14'>
              <motion.div
                variants={variant1}
                className='dark:bg-neutral-980 -top-10 z-[3] flex h-full w-full items-center justify-between gap-x-2 rounded-md border border-neutral-400/20 bg-white p-5 px-2.5 transition-all duration-100 ease-linear dark:border-neutral-800 dark:bg-neutral-900'
              >
                <div className='h-10 w-10 rounded-full bg-pink-300'>
                  <img
                    className='h-full w-full rounded-full object-cover'
                    src='https://yt3.ggpht.com/fxGKYucJAVme-Yz4fsdCroCFCrANWqw0ql4GYuvx8Uq4l_euNJHgE-w9MTkLQA805vWCi-kE0g=s88-c-k-c0x00ffffff-no-rj'
                    alt='MrBeast'
                  />
                </div>
                <div className='flex flex-col gap-y-4 min-w-72 md:min-w-96'>
                  <div className='flex flex-row justify-between'>
                    <div className='h-3 text-lg font-medium dark:text-white'>
                      MrBeast
                    </div>
                    <div className='h-2 mt-1 text-xs font-medium dark:text-white/40'>
                      @mrbeast
                    </div>
                  </div>

                  <div className='flex flex-row justify-between'>
                    <div className='flex flex-row items-center mt-2 text-muted-foreground text-sm gap-2'>
                      <UsersRound size={24} className='text-primary' />
                      <span className='text-secondary-foreground dark:text-primary-foreground'>
                        {" "}
                        {formatValue(361000000)}
                      </span>
                    </div>
                    <div className='flex flex-row items-center justify-end mt-2 gap-2'>
                      <div className='flex flex-row mr-1 text-primary'>
                        <div className='flex'>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm text-${i < Math.floor(3.7) ? "yellow" : "gray"}-400`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className='ml-1 text-sm text-gray-600 items-center'>
                          ({3.7})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={variant2}
                className='absolute bottom-14 z-[2] m-auto flex h-fit w-fit items-center justify-between gap-x-2 rounded-md border border-neutral-400/20 bg-white p-5 px-2.5 transition-all duration-100 ease-linear dark:border-neutral-800 dark:bg-neutral-900'
              >
                <div className='h-10 w-10 rounded-full bg-pink-300'>
                  <img
                    className='h-full w-full rounded-full object-cover'
                    src='https://yt3.ggpht.com/gmimhqe1fHrtWV5nNPyTEVH4JE6R6pECs62M3zOU-0z_aVNkpztti_qxbagt7kFN9ojqaIeo=s88-c-k-c0x00ffffff-no-rj'
                    alt='Kimberly Loaiza'
                  />
                </div>
                <div className='flex flex-col gap-y-4 min-w-72 md:min-w-96'>
                  <div className='flex flex-row justify-between'>
                    <div className='h-3 text-lg font-medium dark:text-white'>
                      Kimberly Loaiza
                    </div>
                    <div className='h-2 mt-1 text-xs font-medium dark:text-white/40'>
                      @kimberlyloaiza
                    </div>
                  </div>

                  <div className='flex flex-row justify-between'>
                    <div className='flex flex-row items-center mt-2 text-muted-foreground text-sm gap-2'>
                      <UsersRound size={24} className='text-primary' />
                      <span className='text-secondary-foreground dark:text-primary-foreground'>
                        {" "}
                        {formatValue(45500000)}
                      </span>
                    </div>
                    <div className='flex flex-row items-end mt-2 gap-2'>
                      <div className='flex flex-row mr-1 text-primary'>
                        <div className='flex'>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm text-${i < Math.floor(0.0) ? "yellow" : "gray"}-400`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className='ml-1 text-sm text-gray-600 items-center'>
                          ({0})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={variant3}
                className='absolute top-24 bottom-14  z-[2] m-auto flex h-fit w-fit items-center justify-between gap-x-2 rounded-md border border-neutral-400/20 bg-white p-5 px-2.5 transition-all duration-100 ease-linear dark:border-neutral-800 dark:bg-neutral-900'
              >
                <div className='h-10 w-10 rounded-full bg-pink-300'>
                  <img
                    className='h-full w-full rounded-full object-cover'
                    src='https://yt3.ggpht.com/VunTf0NzCeboiPjbesBdnQuxaF3Lja7UGRbBGQAWRJgMSTj9TTLO3pS1X9qPOJGCNnmPrXeY=s88-c-k-c0x00ffffff-no-rj'
                    alt='tseries'
                  />
                </div>
                <div className='flex flex-col gap-y-4 min-w-72 md:min-w-96'>
                  <div className='flex flex-row justify-between'>
                    <div className='h-3 text-lg font-medium dark:text-white'>
                      T-Series
                    </div>
                    <div className='h-2 mt-1 text-xs font-medium dark:text-white/40'>
                      @tseries
                    </div>
                  </div>
                  <div className='flex flex-row justify-between'>
                    <div className='flex flex-row items-center mt-2 text-muted-foreground text-sm gap-2'>
                      <UsersRound size={24} className='text-primary' />
                      <span className='text-secondary-foreground dark:text-primary-foreground'>
                        {formatValue(286000000)}
                      </span>
                    </div>
                    <div className='flex flex-row items-end mt-2 gap-2'>
                      <div className='flex flex-row mr-1 text-primary'>
                        <div className='flex'>
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm text-${i < Math.floor(4.2) ? "yellow" : "gray"}-400`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className='ml-1 text-sm text-gray-600 items-center'>
                          ({4.2})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className='flex w-full lg:w-1/2  flex-col items-center justify-center  sm:p-12 '>
        <div className='flex flex-col items-center lg:items-start space-y-8'>
          <div className='flex flex-col gap-y-4 items-center lg:items-start'>
            <h2 className='text-4xl sm:text-5xl font-bold text-rose-700'>
              Following a Creator?
            </h2>
            <h3 className='text-3xl sm:text-4xl font-bold'>Write a review.</h3>
          </div>

          <p className='text-sm text-neutral-600 dark:text-neutral-400'>
            Help billions of daily users find the content that matters.
          </p>
          <button
            className='block text-left py-2 px-4 rounded border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground'
            onClick={() => router.push("/search")}
          >
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
}
