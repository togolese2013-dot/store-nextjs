"use client";
import dynamic from "next/dynamic";
const FinanceManager = dynamic(() => import("./FinanceManager"), { ssr: false, loading: () => null });
export default FinanceManager;
