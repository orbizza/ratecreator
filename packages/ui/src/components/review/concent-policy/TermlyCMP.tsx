"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Termly?: {
      initialize: (options?: { siteId?: string }) => void;
    };
  }
}

const SCRIPT_SRC_BASE = "https://app.termly.io";

export const TermlyCMP = ({
  autoBlock,
  masterConsentsOrigin,
  websiteUUID,
}: {
  autoBlock: boolean;
  masterConsentsOrigin: string;
  websiteUUID: string;
}) => {
  const scriptSrc = useMemo(() => {
    const src = new URL(SCRIPT_SRC_BASE);
    src.pathname = `/resource-blocker/${websiteUUID}`;
    if (autoBlock) {
      src.searchParams.set("autoBlock", "on");
    }
    if (masterConsentsOrigin) {
      src.searchParams.set("masterConsentsOrigin", masterConsentsOrigin);
    }
    return src.toString();
  }, [autoBlock, masterConsentsOrigin, websiteUUID]);

  const isScriptAdded = useRef(false);
  const isPolicyScriptAdded = useRef(false);
  const isScriptLoaded = useRef(false);
  const isPolicyScriptLoaded = useRef(false);

  useEffect(() => {
    if (isScriptAdded.current) return;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      isScriptLoaded.current = true;
      if (window.Termly && typeof window.Termly.initialize === "function") {
        window.Termly.initialize();
      }
    };
    document.head.appendChild(script);
    isScriptAdded.current = true;

    // Add the embed-policy script for cookie policy pages
    if (!isPolicyScriptAdded.current) {
      const policyScript = document.createElement("script");
      policyScript.src = `${SCRIPT_SRC_BASE}/embed-policy.min.js`;
      policyScript.async = true;
      policyScript.onload = () => {
        isPolicyScriptLoaded.current = true;
      };
      document.head.appendChild(policyScript);
      isPolicyScriptAdded.current = true;
    }
  }, [scriptSrc]);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    // Only try to initialize if both scripts are loaded
    if (isScriptLoaded.current && isPolicyScriptLoaded.current) {
      if (window.Termly && typeof window.Termly.initialize === "function") {
        window.Termly.initialize();
      }
    }
  }, [pathname, searchParams]);

  return null;
};
