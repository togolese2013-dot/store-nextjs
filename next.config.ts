import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 uses Node.js built-ins (net, tls) — must run server-side only
  serverExternalPackages: ["mysql2"],
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
