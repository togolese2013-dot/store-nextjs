"use client";
import dynamic from "next/dynamic";
const MouvementModal = dynamic(() => import("./MouvementModal"), { ssr: false, loading: () => null });
export default MouvementModal;
