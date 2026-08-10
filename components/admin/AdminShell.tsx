"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import OrderNotifier from "./OrderNotifier";
import MessageNotifier from "./MessageNotifier";
import { AdminSSEProvider, useAdminSSE } from "./useAdminSSE";
import { setDatePrefs } from "@/lib/format-date";

import type { AdminPermissions } from "@/lib/admin-permissions";

interface Props {
  nom:         string;
  role:        string;
  permissions: AdminPermissions | null;
  children:    React.ReactNode;
}

/* ── Inner shell — consumes SSE context ─────────────────────────────────── */
function AdminShellContent({ nom, role, permissions, children }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { subscribe } = useAdminSSE();

  useEffect(() => {
    fetch("/api/admin/auth/refresh", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  // Apply the saved date/timezone preference (Paramètres compte → Préférences) app-wide.
  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then(r => r.json())
      .then(cfg => setDatePrefs({ format: cfg.pref_format_date, timezone: cfg.pref_fuseau }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "connected" || event.type === "reconnect" || event.type === "message") return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // Skip if user is actively typing in an input or textarea
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
        router.refresh();
      }, 3_000);
    });
  }, [subscribe, router]);

  const ADMIN_ZONE = ["/admin/admin-ws", "/admin/config", "/admin/settings", "/admin/users", "/admin/rapports", "/admin/tendances", "/admin/magasin", "/admin/store", "/admin/boutique", "/admin/saas", "/admin/crm", "/admin/billing"];
  const STORE_EXCEPTIONS = ["/admin/settings/delivery", "/admin/settings/payment"];
  const isAdminZone = pathname === "/admin" || ADMIN_ZONE.some(p =>
    (pathname === p || pathname.startsWith(p + "/")) &&
    !STORE_EXCEPTIONS.some(s => pathname.startsWith(s))
  );

  // La session peut expirer pendant qu'AdminShell est déjà monté (navigation client
  // réutilisant le layout parent) — /admin/login et /admin/onboarding ne doivent
  // jamais afficher AdminSidebar, même si le layout serveur ne s'est pas ré-exécuté.
  const isBypassRoute = pathname.startsWith("/admin/login") || pathname.startsWith("/admin/onboarding");

  if (isBypassRoute || isAdminZone) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <AdminSidebar
        nom={nom}
        role={role}
        permissions={permissions}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="lg:pl-60 xl:pl-64 min-w-0">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-brand-700 text-brand-700 text-sm font-semibold"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>
          </div>
          {children}
        </main>
      </div>
      <OrderNotifier />
      <MessageNotifier />
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
