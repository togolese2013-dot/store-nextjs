"use client";
import { useRouter } from "next/navigation";
import { SubscriptionPage } from "@/components/subscription";

export default function BillingPage() {
  const router = useRouter();
  return <SubscriptionPage onBack={() => router.back()} />;
}
