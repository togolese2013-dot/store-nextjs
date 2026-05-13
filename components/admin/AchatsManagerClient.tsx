"use client";
import dynamic from "next/dynamic";
const AchatsManager = dynamic(() => import("./AchatsManager"), { ssr: false, loading: () => null });
export default AchatsManager;
