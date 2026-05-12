import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

const securityHeaders = [
  // Prevent the site from being embedded in iframes (anti-clickjacking)
  { key: "X-Frame-Options",        value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  // Restrict browser features
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  // Force HTTPS for 1 year (only effective in production with valid SSL)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Basic XSS protection for older browsers
  { key: "X-XSS-Protection",       value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    const rules = [];
    if (BACKEND_URL) {
      rules.push({ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` });
    }
    // Proxy Séréna AI widget chat endpoint
    rules.push({ source: "/chat", destination: "https://serena-togolese-production.up.railway.app/chat" });
    return rules;
  },
};

export default nextConfig;
