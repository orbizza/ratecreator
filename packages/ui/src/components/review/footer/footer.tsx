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
    <footer className="z-50 bg-black text-white py-16">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row">
          {/* Logo, company name, and social icons */}
          <div className="flex justify-between items-start lg:flex-col lg:justify-between mb-8 lg:mb-0 lg:mr-44">
            <Link
              className="flex items-center"
              href={"#"}
              aria-label="RateCreator Logo"
            >
              <Image
                src="/logo.svg"
                alt="RateCreator Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <div className="text-sm lg:text-lg font-semibold">
                RATE
                <span className="text-[#ff3131] "> CREATOR</span>{" "}
                {/* <span className='text-muted-foreground'>
                  - Reviewing the Influencers
                </span> */}
              </div>
            </Link>
            {/* Social icons now on the same row for md and sm, at the bottom for lg */}
            <div className="flex space-x-4  lg:mt-auto">
              <Link
                href="https://x.com/ratecreator"
                target="_blank"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-primary-foreground/80"
              >
                <SiX size={20} />
              </Link>
              <Link
                href="https://www.instagram.com/_orbizza"
                target="_blank"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-primary-foreground/80"
              >
                <SiInstagram size={20} />
              </Link>
              <Link
                href="https://www.youtube.com/@orbizza"
                target="_blank"
                aria-label="YouTube"
                className="text-muted-foreground hover:text-primary-foreground/80"
              >
                <SiYoutube size={20} />
              </Link>
              <Link
                href="https://www.linkedin.com/company/orbizza"
                target="_blank"
                aria-label="LinkedIn"
                className="text-muted-foreground hover:text-primary-foreground/80"
              >
                <SiLinkedin size={20} />
              </Link>
              <Link
                href="#"
                aria-label="Discord"
                className="text-muted-foreground hover:text-primary-foreground/80"
              >
                <SiDiscord size={20} />
              </Link>
            </div>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:flex-1">
            <div>
              <h3 className="font-normal mb-5">Community</h3>
              <ul className="text-sm space-y-4">
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Trust in reviews</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Help Center</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/sign-in">Log in</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/sign-up">Get Started</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Guidelines for reviews</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-normal mb-5">Creators</h3>
              <ul className="text-sm space-y-4">
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="https://creator.ratecreator.com" target="_blank">
                    For Creators
                  </Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="https://creator.ratecreator.com" target="_blank">
                    Features
                  </Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="https://creator.ratecreator.com" target="_blank">
                    Pricing
                  </Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="https://creator.ratecreator.com" target="_blank">
                    Creator login
                  </Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="https://creator.ratecreator.com" target="_blank">
                    Blog for creators
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-normal mb-5">Company</h3>
              <ul className="text-sm space-y-4">
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Why we&apos;re here</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Our Story</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">How it works</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Changelog</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Roadmap</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Brand</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-normal mb-5">Resources</h3>
              <ul className="text-sm space-y-4">
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Blog</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Creator Economy Glossary</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Categories Glossary</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Newsletter</Link>
                </li>
                <li className="text-muted-foreground hover:text-primary-foreground/80">
                  <Link href="/wip">Report a vulnerability</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright and links */}
        <div className="flex flex-col-reverse gap-y-5 md:gap-y-0 md:flex-row justify-between items-center mt-16 pt-8 border-t border-gray-800">
          <div className="text-primary-foreground text-[11px]">
            &copy; 2024{" "}
            <Link href="https://orbizza.com" target="_blank">
              Orbizza, Inc.
            </Link>{" "}
            All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center md:justify-start space-x-4  text-[11px]  mb-4 md:mb-0">
            <Link
              href="/wip"
              className="text-muted-foreground hover:text-primary-foreground/80"
            >
              Privacy policy
            </Link>
            <Link
              href="/wip"
              className="text-muted-foreground hover:text-primary-foreground/80"
            >
              Terms
            </Link>
            <Link
              href="/wip"
              className="text-muted-foreground hover:text-primary-foreground/80"
            >
              Status
            </Link>
            <Link
              href="/wip"
              className="text-muted-foreground hover:text-primary-foreground/80"
            >
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
