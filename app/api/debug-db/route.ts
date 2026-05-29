import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

export async function GET() {
  const info = {
    DB_HOST: process.env.DB_HOST || "(not set)",
    DB_PORT: process.env.DB_PORT || "(not set)",
    DB_USER: process.env.DB_USER || "(not set)",
    DB_NAME: process.env.DB_NAME || "(not set)",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "(not set)",
    NODE_ENV: process.env.NODE_ENV,
    status: "unknown" as string,
    error: null as string | null,
  };

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>("SELECT 1 AS ok");
    info.status = rows[0]?.ok === 1 ? "connected" : "unexpected result";
  } catch (e: unknown) {
    const err = e as Error & { code?: string; errno?: number };
    info.status = "failed";
    info.error = `${err.code ?? ""} ${err.message}`;
  }

  return NextResponse.json(info);
}
