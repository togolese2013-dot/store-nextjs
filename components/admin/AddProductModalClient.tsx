"use client";
import dynamic from "next/dynamic";
const AddProductModal = dynamic(() => import("./AddProductModal"), { ssr: false, loading: () => null });
export default AddProductModal;
