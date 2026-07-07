import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["xlsx"],
  // Disable exposing X-Powered-By header
  poweredByHeader: false,
  // Disallow search engine indexing
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default config;
