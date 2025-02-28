"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    Termly?: {
      initialize: (options?: { siteId?: string }) => void;
    };
  }
}

export default function TermsOfService() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  // Your site ID - make sure this matches your account
  const TERMLY_SITE_ID = "0045a283-ebd3-41b7-93c1-759475c25430";
  const TERMLY_POLICY_URL = `https://app.termly.io/policy-viewer/policy.html?policyUUID=${TERMLY_SITE_ID}`;

  useEffect(() => {
    // Check if running in local environment
    const hostname = window.location.hostname;
    const isLocalEnvironment =
      hostname === "localhost" || hostname === "127.0.0.1";
    setIsLocal(isLocalEnvironment);

    // Set a timeout to hide the loading spinner after a reasonable time
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // If we're in a local environment, we don't need to wait for an error
    if (isLocalEnvironment) {
      setError(null); // Clear any error since we'll show the local environment message instead
      return () => clearTimeout(loadingTimer);
    }

    // Check if is already initialized
    if (typeof window !== "undefined") {
      // If there's an error after waiting, show it
      const errorTimer = setTimeout(() => {
        const termlyElement = document.querySelector(
          '[data-name="termly-embed"]',
        );
        if (termlyElement && !termlyElement.innerHTML) {
          setError(
            "Terms of Service content could not be loaded. Please try refreshing the page or view the terms directly.",
          );
        }
      }, 5000);

      return () => {
        clearTimeout(loadingTimer);
        clearTimeout(errorTimer);
      };
    }

    return () => clearTimeout(loadingTimer);
  }, []);

  return (
    <div className="container mx-auto py-8 mt-10">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>

      {isLocal && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 mb-6 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> You are viewing this page in a local
            development environment. The terms of service widget will not
            display correctly on localhost. Please view this page in a
            production environment to see the actual terms of service.
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 mt-2">
            requires a valid domain to function properly and cannot be fully
            tested in a local environment.
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 mt-2">
            You can view the terms of service directly at:{" "}
            <a
              href={TERMLY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-600"
            >
              Terms of Service
            </a>
          </p>
        </div>
      )}

      {error && !isLocal && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-6 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <p className="text-red-800 dark:text-red-200 mt-2">
            You can view the terms of service directly at:{" "}
            <a
              href={TERMLY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-600"
            >
              Terms of Service
            </a>
          </p>
        </div>
      )}

      {isLoading && !isLocal && (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLocal && (
        <div
          data-name="termly-embed"
          data-id={TERMLY_SITE_ID}
          className="min-h-[600px]"
        />
      )}

      {isLocal && (
        <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-md min-h-[600px]">
          <h2 className="text-xl font-semibold mb-4">
            Terms of Service Content Preview
          </h2>
          <p className="mb-3">
            This is a placeholder for the terms of service content that would
            appear in a production environment.
          </p>
          <p className="mb-3">
            The terms of service typically includes information about:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>User rights and responsibilities</li>
            <li>Acceptable use of the service</li>
            <li>Intellectual property rights</li>
            <li>Limitation of liability</li>
            <li>Dispute resolution procedures</li>
            <li>Termination of service conditions</li>
          </ul>
          <p className="mb-4">
            In production, this content is dynamically loaded from based on your
            configured settings.
          </p>
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="font-medium">
              View the actual terms of service at:{" "}
              <a
                href={TERMLY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
              >
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
