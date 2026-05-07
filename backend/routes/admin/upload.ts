import express from "express";
import { getSession } from "../../lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 10 * 1024 * 1024;

/** Detect real MIME type from magic bytes — never trust client-supplied type. */
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 4) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (buf.length >= 12 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

const router = express.Router();

async function uploadToCloudinary(buffer: Buffer, _clientType: string): Promise<string> {
  if (buffer.length > MAX_SIZE) throw new Error("Fichier trop volumineux (max 10 Mo)");

  // Verify real type from magic bytes — ignore client-supplied type
  const realMime = detectMimeFromBuffer(buffer);
  if (!realMime) throw new Error("Format de fichier non reconnu. Utilisez JPEG, PNG, WebP ou GIF.");

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
