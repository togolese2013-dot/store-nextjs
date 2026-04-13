"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import OrderNotifier from "./OrderNotifier";

interface Props {
  nom:      string;
  role:     string;
  children: React.ReactNode;
}

export default function AdminShell({ nom, role, children }: Props) {
  const pathname = usePathname();

  // Landing page — no sidebar, no notifications
  if (pathname === "/admin") {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar nom={nom} role={role} />
      <div className="lg:pl-60 xl:pl-64 pt-14 lg:pt-0">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <OrderNotifier />
    </div>
  );
}
