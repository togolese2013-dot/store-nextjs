import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
