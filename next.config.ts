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
    "react-aria",
    "@thesysai/genui-sdk",
    "@crayonai/react-ui",
    "@crayonai/react-core",
    "@crayonai/stream"
  ],
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      'property-information/find': path.resolve(__dirname, 'node_modules/property-information/lib/find.js'),
      'property-information/normalize': path.resolve(__dirname, 'node_modules/property-information/lib/normalize.js'),
      'property-information/html': path.resolve(__dirname, 'node_modules/property-information/lib/html.js'),
    };
    return config;
  },
};

export default nextConfig;
