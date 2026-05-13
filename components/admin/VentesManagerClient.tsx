"use client";
import dynamic from "next/dynamic";
const VentesManager = dynamic(() => import("./VentesManager"), { ssr: false, loading: () => null });
export default VentesManager;
