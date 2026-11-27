import type { NextConfig } from "next";

// GitHub Pages serves the site as plain static files from /<repository>/.
// The deploy workflow sets these two variables; without them (local dev,
// `npm run build`) nothing below applies.
const forPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(forPages && {
    output: "export",
    basePath,
    trailingSlash: true,
    // there is no image optimisation server on a static host
    images: { unoptimized: true },
  }),
};

export default nextConfig;
