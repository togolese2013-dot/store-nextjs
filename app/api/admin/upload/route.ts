import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Save to /tmp/uploads — always writable on any container (Railway, Vercel, etc.)
async function saveFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Type non autorisé: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 5 Mo)");
  }

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const dir      = join("/tmp", "uploads");

  await mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(dir, filename), Buffer.from(bytes));

  // Served via /api/uploads/[filename] route
  return `/api/uploads/${filename}`;
}

/* POST /api/admin/upload — single or multiple files */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file  = formData.get("file")  as File | null;
  const files = formData.getAll("files") as File[];

  const filesToProcess = files.length > 0 ? files : file ? [file] : [];
  if (filesToProcess.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const results: { url: string; error?: string }[] = [];
  for (const f of filesToProcess) {
    try {
      results.push({ url: await saveFile(f) });
    } catch (err) {
      results.push({ url: "", error: err instanceof Error ? err.message : "Erreur upload" });
    }
  }

  const allOk = results.every(r => !r.error);
  if (allOk) {
    return NextResponse.json({ success: true, urls: results.map(r => r.url) });
  }
  return NextResponse.json({
    success: false,
    urls:   results.map(r => r.url),
    errors: results.filter(r => r.error).map(r => r.error),
  }, { status: 207 });
}
