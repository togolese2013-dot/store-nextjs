"use client";

import LivreurDashboard from "@/components/livreur-app/LivreurDashboard";
import { createApi } from "@/components/livreur-app/api";
import { realAdapter } from "@/lib/livreur-adapter";

const api = createApi(realAdapter);

export default function LivreurPage() {
  return <LivreurDashboard api={api} />;
}
