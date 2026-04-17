import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl     = process.env.DATABASE_URL;
  const mysqlUrl  = process.env.MYSQL_URL;
  const pubUrl    = process.env.MYSQL_PUBLIC_URL;
  const dbHost    = process.env.DB_HOST;
  const dbPort    = process.env.DB_PORT;
  const dbName    = process.env.DB_NAME;

  // Mask passwords for safety
  const mask = (s?: string) => s ? s.replace(/:([^@]+)@/, ":***@") : null;

  return NextResponse.json({
    status:           "ok",
    DATABASE_URL:     mask(dbUrl),
    MYSQL_URL:        mask(mysqlUrl),
    MYSQL_PUBLIC_URL: mask(pubUrl),
    DB_HOST:          dbHost ?? null,
    DB_PORT:          dbPort ?? null,
    DB_NAME:          dbName ?? null,
  });
}
