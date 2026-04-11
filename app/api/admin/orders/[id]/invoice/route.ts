import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getOrderById } from "@/lib/admin-db";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";
import React from "react";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  // Parse items if stored as JSON string
  const orderData = {
    ...order,
    items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
  };

  const buffer = await renderToBuffer(
    React.createElement(InvoiceDocument, { order: orderData }) as React.ReactElement<DocumentProps>
  );

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${order.reference}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
