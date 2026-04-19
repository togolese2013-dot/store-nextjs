import { NextRequest, NextResponse } from "next/server";
import { getProducts, getProductsByIds } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  try {
    /* Wishlist / ids filter */
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0).slice(0, 50);
      if (ids.length === 0) return NextResponse.json({ success: true, data: [] });
      const products = await getProductsByIds(ids);
      return NextResponse.json({ success: true, data: products });
    }

    const products = await getProducts({
      categoryId: searchParams.get("category") ? Number(searchParams.get("category")) : undefined,
      search:     searchParams.get("q")        ?? undefined,
      promoOnly:  searchParams.get("promo")    === "true",
      newOnly:    searchParams.get("new")      === "true",
      limit:      searchParams.get("limit")    ? Number(searchParams.get("limit")) : 60,
      offset:     searchParams.get("offset")   ? Number(searchParams.get("offset")) : 0,
    });

    return NextResponse.json({ success: true, data: products });
  } catch (err) {
    console.error("[API /products]", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
