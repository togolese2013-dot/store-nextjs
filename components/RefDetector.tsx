"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RefDetector() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (!ref) return;
    // Set cookie for 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `ts_ref=${encodeURIComponent(ref.toUpperCase())}; expires=${expires}; path=/; SameSite=Lax`;
  }, [params]);

  return null;
}
