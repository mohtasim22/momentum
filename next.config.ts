import type { NextConfig } from "next";

// Sent with every response. Cheap protection that browsers enforce for us.
const securityHeaders = [
  // Don't let other sites put Momentum in a frame (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't guess file types: a file is only ever what its Content-Type says
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only "momentum.app", never full URLs with ids or tokens
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app needs none of these
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Always HTTPS once seen over HTTPS (ignored on http://localhost)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
