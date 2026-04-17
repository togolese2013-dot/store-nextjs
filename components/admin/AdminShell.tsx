"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminTopBar from "./AdminTopBar";
import AdminSidebar from "./AdminSidebar";
import OrderNotifier from "./OrderNotifier";

interface Props {
  nom:      string;
  role:     string;
  children: React.ReactNode;
}

export default function AdminShell({ nom, role, children }: Props) {
  const pathname     = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Landing page — top bar only, no sidebar
  if (pathname === "/admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminTopBar nom={nom} role={role} />
        <div className="pt-14">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminTopBar
        nom={nom}
        role={role}
        onMobileMenuToggle={() => setMobileOpen(o => !o)}
      />
      <AdminSidebar
        nom={nom}
        role={role}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="lg:pl-60 xl:pl-64 pt-14">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <OrderNotifier />
    </div>
  );
}
