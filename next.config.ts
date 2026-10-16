import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every authenticated page in this HRMS renders
  // per-user dynamic data (session + MongoDB), which fits the classic
  // dynamic rendering model better than static shells + Suspense.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
