"use client";

import dynamic from "next/dynamic";

const AnalyticsManager = dynamic(
  () => import("./AnalyticsManager"),
  { ssr: false, loading: () => null }
);

export default function AnalyticsClient() {
  return <AnalyticsManager />;
}
