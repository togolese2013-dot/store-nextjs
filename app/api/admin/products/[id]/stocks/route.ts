import { NextResponse } from "next/server";

// Entrepots removed — stock is now stored directly on produits.stock_magasin
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}
