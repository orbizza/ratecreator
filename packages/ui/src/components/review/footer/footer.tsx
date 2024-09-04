"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiLinkedin,
  SiDiscord,
} from "@icons-pack/react-simple-icons";

export const Footer = () => {
  return (
    <footer className='z-50 bg-black text-white py-16'>
      <div className='max-w-screen-xl mx-auto px-4'>
        <div className='flex flex-col lg:flex-row'>
          {/* Logo, company name, and social icons */}
          <div className='flex justify-between items-start lg:flex-col lg:justify-between mb-8 lg:mb-0 lg:mr-44'>
            <Link
              className='flex items-center'
              href={"#"}
              aria-label='RateCreator Logo'
            >
              <Image
                src='/logo.svg'
                alt='RateCreator Logo'
                width={32}
                height={32}
                className='mr-2'
              />
              <div className='text-sm lg:text-lg font-semibold'>
                RATE
                <span className='text-[#ff3131] '> CREATOR</span>{" "}
                {/* <span className='text-muted-foreground'>
                  - Reviewing the Influencers
                </span> */}
              </div>
            </Link>
            {/* Social icons now on the same row for md and sm, at the bottom for lg */}
            <div className='flex space-x-4  lg:mt-auto'>
              <Link
                href='#'
                aria-label='Twitter'
                className='text-muted-foreground hover:text-primary-foreground/80'
              >
                <SiX size={20} />
              </Link>
              <Link
                href='#'
                aria-label='Instagram'
                className='text-muted-foreground hover:text-primary-foreground/80'
              >
                <SiInstagram size={20} />
              </Link>
              <Link
                href='#'
                aria-label='YouTube'
                className='text-muted-foreground hover:text-primary-foreground/80'
              >
                <SiYoutube size={20} />
              </Link>
              <Link
                href='#'
                aria-label='LinkedIn'
                className='text-muted-foreground hover:text-primary-foreground/80'
              >
                <SiLinkedin size={20} />
              </Link>
              <Link
                href='#'
                aria-label='Discord'
                className='text-muted-foreground hover:text-primary-foreground/80'
              >
                <SiDiscord size={20} />
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 lg:flex-1'>
            <div>
              <h3 className='font-normal mb-5'>Community</h3>
              <ul className='text-sm space-y-4'>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Trust in reviews</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Help Center</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Log in</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Get Started</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Guidelines for reviews</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-normal mb-5'>Creators</h3>
              <ul className='text-sm space-y-4'>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>For Creators</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Features</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Pricing</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Creator login</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Blog for creators</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-normal mb-5'>Company</h3>
              <ul className='text-sm space-y-4'>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Why we&apos;re here</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Our Story</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>How it works</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Changelog</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Roadmap</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Brand</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Contact</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='font-normal mb-5'>Resources</h3>
              <ul className='text-sm space-y-4'>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Blog</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Creator Economy Glossary</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Categories Glossary</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Newsletter</Link>
                </li>
                <li className='text-muted-foreground hover:text-primary-foreground/80'>
                  <Link href='#'>Report a vulnerability</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright and links */}
        <div className='flex flex-col-reverse gap-y-5 md:gap-y-0 md:flex-row justify-between items-center mt-16 pt-8 border-t border-gray-800'>
          <div className='text-primary-foreground text-[11px]'>
            &copy; 2024 Orbizza, Inc. All rights reserved.
          </div>
          <div className='flex flex-wrap justify-center md:justify-start space-x-4  text-[11px]  mb-4 md:mb-0'>
            <Link
              href='#'
              className='text-muted-foreground hover:text-primary-foreground/80'
            >
              Privacy policy
            </Link>
            <Link
              href='#'
              className='text-muted-foreground hover:text-primary-foreground/80'
            >
              Terms
            </Link>
            <Link
              href='#'
              className='text-muted-foreground hover:text-primary-foreground/80'
            >
              Status
            </Link>
            <Link
              href='#'
              className='text-muted-foreground hover:text-primary-foreground/80'
            >
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
