import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Cloudinary upload (production) ──────────────────────────────────────────
async function uploadToCloudinary(file: File): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "togolese-shop/products", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload échoué"));
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

// ─── Local disk upload (development fallback) ─────────────────────────────────
async function uploadToLocal(file: File): Promise<string> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join }             = await import("path");
  const { randomUUID }       = await import("crypto");

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const dir      = join(process.cwd(), "public", "uploads");

  await mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(join(dir, filename), Buffer.from(bytes));

  return `/uploads/${filename}`;
}

async function saveFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Type non autorisé: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 5 Mo)");
  }

  // Use Cloudinary when credentials are configured, otherwise local disk
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(file);
  }
  return uploadToLocal(file);
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
      const url = await saveFile(f);
      results.push({ url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur upload";
      results.push({ url: "", error: msg });
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
  }, { status: 400 });
}
