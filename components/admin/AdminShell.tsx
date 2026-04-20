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
    const timer = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(timer);
  }, [router]);

  // Landing page — no sidebar
  if (pathname === "/admin") {
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
