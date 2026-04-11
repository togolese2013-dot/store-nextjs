import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { approveReview, deleteReview } from "@/lib/admin-db";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const body = await req.json();
  if (body._delete) await deleteReview(Number(body.id));
  else await approveReview(Number(body.id), Boolean(body.approved));
  return NextResponse.json({ ok: true });
}
