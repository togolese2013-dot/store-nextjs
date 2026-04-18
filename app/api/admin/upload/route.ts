import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (compression is done client-side)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Type non autorisé: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 10 Mo)");
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "togolese-shop", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload échoué"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
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
      results.push({ url: await uploadToCloudinary(f) });
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
