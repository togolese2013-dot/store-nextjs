"use client";
import dynamic from "next/dynamic";
const LivraisonsManager = dynamic(() => import("./LivraisonsManager"), { ssr: false, loading: () => null });
export default LivraisonsManager;
