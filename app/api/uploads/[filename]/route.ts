import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const MIME: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  gif:  "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Try /tmp/uploads first (runtime uploads), then public/uploads (legacy)
  const candidates = [
    join("/tmp", "uploads", filename),
    join(process.cwd(), "public", "uploads", filename),
  ];

  for (const filePath of candidates) {
    try {
      const data = await readFile(filePath);
      const ext  = filename.split(".").pop()?.toLowerCase() ?? "";
      const mime = MIME[ext] ?? "application/octet-stream";
      return new NextResponse(data, {
        headers: {
          "Content-Type":  mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // try next candidate
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
