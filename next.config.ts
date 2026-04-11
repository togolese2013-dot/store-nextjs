import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 uses Node.js built-ins (net, tls) — must run server-side only
  serverExternalPackages: ["mysql2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "store.togolese.net" },
      { protocol: "http",  hostname: "localhost" },
      // Cloudinary — production image hosting
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
