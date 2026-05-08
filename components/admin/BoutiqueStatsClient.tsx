"use client";

import dynamic from "next/dynamic";

const BoutiqueStatsManager = dynamic(
  () => import("./BoutiqueStatsManager"),
  { ssr: false, loading: () => null }
);

export default function BoutiqueStatsClient() {
  return <BoutiqueStatsManager />;
}
