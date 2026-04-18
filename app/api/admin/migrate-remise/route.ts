import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ONE-TIME migration — alter remise column to DECIMAL(10,2) to support FCFA amounts
// DELETE THIS FILE after running it once.
export async function GET() {
  try {
    await db.execute(
      `ALTER TABLE produits MODIFY COLUMN remise DECIMAL(10,2) NOT NULL DEFAULT 0`
    );
    return NextResponse.json({ ok: true, message: "remise column altered to DECIMAL(10,2)" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
