"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import OrderNotifier from "./OrderNotifier";

interface Props {
  nom:      string;
  role:     string;
  children: React.ReactNode;
}

export default function AdminShell({ nom, role, children }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource(`/api/admin/events`);
      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as { type: string };
          if (event.type !== "connected") router.refresh();
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 5_000);
      };
    }

    connect();
    return () => {
      es?.close();
      clearTimeout(retryTimer);
    };
  }, [router]);

  // Landing page + Admin zone — no sidebar, no chrome
  const ADMIN_ZONE = ["/admin/config", "/admin/settings", "/admin/users", "/admin/rapports", "/admin/tendances"];
  // STORE settings pages must keep sidebar despite being under /admin/settings
  const STORE_EXCEPTIONS = ["/admin/settings/delivery", "/admin/settings/payment", "/admin/store"];
  const isAdminZone = pathname === "/admin" || ADMIN_ZONE.some(p =>
    (pathname === p || pathname.startsWith(p + "/")) &&
    !STORE_EXCEPTIONS.some(s => pathname.startsWith(s))
  );
  if (isAdminZone) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar
        nom={nom}
        role={role}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="lg:pl-60 xl:pl-64">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {/* Mobile hamburger — top of content */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-900 text-white text-sm font-semibold"
          >
            <span className="flex flex-col gap-1">
              <span className="w-4 h-0.5 bg-white rounded" />
              <span className="w-4 h-0.5 bg-white rounded" />
              <span className="w-4 h-0.5 bg-white rounded" />
            </span>
            Menu
          </button>
          {children}
        </main>
      </div>
      <OrderNotifier />
    </div>
  );
}
