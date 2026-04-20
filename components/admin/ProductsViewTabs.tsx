"use client";

import { useRouter, useSearchParams } from "next/navigation";
import TabBar from "./TabBar";
import type { TabItem } from "./TabBar";

interface Props {
  tabs:   TabItem[];
  active: string;
}

export default function ProductsViewTabs({ tabs, active }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  function handleChange(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "stock") params.delete("view");
    else params.set("view", key);
    params.delete("page");
    router.push(`/admin/products?${params.toString()}`);
  }

  return <TabBar tabs={tabs} active={active} onChange={handleChange} accent="brand" />;
}
