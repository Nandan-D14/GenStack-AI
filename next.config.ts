import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: [
    "@heroui/react",
    "@react-aria/breadcrumbs",
    "@react-aria/link",
    "@react-aria/live-announcer",
    "@react-aria/toggle",
    "@react-aria/calendar",
    "@react-aria/checkbox",
    "@react-aria/combobox",
    "react-aria"
  ],
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
    ];
    return config;
  },
};

export default nextConfig;
