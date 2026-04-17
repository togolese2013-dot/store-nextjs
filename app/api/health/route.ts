import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl     = process.env.DATABASE_URL;
  const mysqlUrl  = process.env.MYSQL_URL;
  const pubUrl    = process.env.MYSQL_PUBLIC_URL;
  const dbHost    = process.env.DB_HOST;
  const dbPort    = process.env.DB_PORT;
  const dbName    = process.env.DB_NAME;

  const mask = (s?: string) => s ? s.replace(/:([^@]+)@/, ":***@") : null;

  // Test real DB connection and list tables
  let dbStatus = "untested";
  let dbError: string | null = null;
  let tables: string[] = [];
  try {
    const [rows] = await db.execute<import("mysql2").RowDataPacket[]>(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    tables = rows.map((r) => r.TABLE_NAME as string);
    dbStatus = "connected";
  } catch (e) {
    dbStatus = "error";
    dbError  = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    status:           "ok",
    db_status:        dbStatus,
    db_error:         dbError,
    tables,
    DATABASE_URL:     mask(dbUrl),
    MYSQL_URL:        mask(mysqlUrl),
    MYSQL_PUBLIC_URL: mask(pubUrl),
    DB_HOST:          dbHost ?? null,
    DB_PORT:          dbPort ?? null,
    DB_NAME:          dbName ?? null,
  });
}
