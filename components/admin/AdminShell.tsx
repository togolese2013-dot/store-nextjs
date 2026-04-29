"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import OrderNotifier from "./OrderNotifier";
import { AdminSSEProvider, useAdminSSE } from "./useAdminSSE";

import type { AdminPermissions } from "@/lib/admin-permissions";

interface Props {
  nom:         string;
  role:        string;
  permissions: AdminPermissions | null;
  children:    React.ReactNode;
}

/* ── Inner shell — consumes SSE context ─────────────────────────────────── */
function AdminShellContent({ nom, role, permissions, children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [hasUpdates,  setHasUpdates]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { subscribe } = useAdminSSE();

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "connected" || event.type === "heartbeat") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setHasUpdates(true), 3_000);
    });
  }, [subscribe]);

  const handleRefresh = useCallback(() => {
    setHasUpdates(false);
    router.refresh();
  }, [router]);

  const ADMIN_ZONE = ["/admin/config", "/admin/settings", "/admin/users", "/admin/rapports", "/admin/tendances"];
  const STORE_EXCEPTIONS = ["/admin/settings/delivery", "/admin/settings/payment", "/admin/store"];
  const isAdminZone = pathname === "/admin" || ADMIN_ZONE.some(p =>
    (pathname === p || pathname.startsWith(p + "/")) &&
    !STORE_EXCEPTIONS.some(s => pathname.startsWith(s))
  );

  // Fullscreen pages (cards, config, users…) — header only, no sidebar
  if (isAdminZone) {
    return (
      <>
        <AdminTopBar nom={nom} role={role} />
        <div className="pt-14">{children}</div>
      </>
    );
  }

  // Sidebar pages
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminTopBar nom={nom} role={role} onMobileMenuToggle={() => setMobileOpen(true)} />
      <AdminSidebar
        nom={nom}
        role={role}
        permissions={permissions}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="lg:pl-60 xl:pl-64 pt-14">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {hasUpdates && (
            <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl animate-fade-up">
              <span className="text-sm text-emerald-800 font-medium">
                Nouvelles données disponibles
              </span>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      <OrderNotifier />
    </div>
  );
}

/* ── Public export — provides SSE context then renders shell ─────────────── */
export default function AdminShell(props: Props) {
  return (
    <AdminSSEProvider>
      <AdminShellContent {...props} />
    </AdminSSEProvider>
  );
}

