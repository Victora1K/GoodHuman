import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@goodhuman/shared"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/public/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/public/**" },
    ],
  },
};

export default nextConfig;
