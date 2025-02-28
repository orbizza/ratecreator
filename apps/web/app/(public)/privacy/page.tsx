"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Termly?: {
      initialize: () => void;
    };
  }
}

export default function PrivacyPolicy() {
  const [isLocal, setIsLocal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running in local environment
    const hostname = window.location.hostname;
    setIsLocal(hostname === "localhost" || hostname === "127.0.0.1");

    // Initialize Termly after the component mounts
    if (typeof window !== "undefined" && window.Termly) {
      window.Termly.initialize();
    }

    // Set loading to false after a timeout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8 mt-10">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>

      {isLocal && !isLoading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 mb-6 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> You are viewing this page in a local
            development environment. The Termly privacy policy widget may not
            display correctly on localhost. Please view this page in a
            production environment to see the actual privacy policy.
          </p>
        </div>
      )}

      <div
        data-name="termly-embed"
        data-id="513f4b24-bc95-4b92-8d58-977282918862"
        className="min-h-[600px]"
      />

      <Script
        id="termly-jssdk"
        src="https://app.termly.io/embed-policy.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Termly) {
            window.Termly.initialize();
          }
        }}
      />
    </div>
  );
}
