import express from "express";
import { getSession } from "../../lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE      = 10 * 1024 * 1024;

const router = express.Router();

async function uploadToCloudinary(buffer: Buffer, mimetype: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(mimetype)) throw new Error(`Type non autorisé: ${mimetype}`);
  if (buffer.length > MAX_SIZE) throw new Error("Fichier trop volumineux (max 10 Mo)");
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

router.post("/api/admin/upload", async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Non autorisé." });

  // Handle raw body if content-type is multipart — parse manually via express raw
  // For simplicity we accept base64 JSON body: { files: [{ data: "base64...", type: "image/jpeg" }] }
  const { files: rawFiles, file: rawFile } = req.body as {
    files?: { data: string; type: string; name?: string }[];
    file?:  { data: string; type: string; name?: string };
  };

  const filesToProcess = rawFiles?.length ? rawFiles : rawFile ? [rawFile] : [];
  if (!filesToProcess.length) {
    return res.status(400).json({ error: "Aucun fichier reçu." });
  }

  const results: { url: string; error?: string }[] = [];
  for (const f of filesToProcess) {
    try {
      const buffer = Buffer.from(f.data.replace(/^data:[^;]+;base64,/, ""), "base64");
      results.push({ url: await uploadToCloudinary(buffer, f.type) });
    } catch (err) {
      results.push({ url: "", error: err instanceof Error ? err.message : "Erreur upload" });
    }
  }

  const allOk = results.every(r => !r.error);
  res.status(allOk ? 200 : 207).json({
    success: allOk,
    urls:   results.map(r => r.url),
    errors: results.filter(r => r.error).map(r => r.error),
  });
});

export default router;
