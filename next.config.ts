import type { NextConfig } from "next";

// GitHub Pages serves the site as plain static files from /<repository>/.
// The deploy workflow sets these two variables; without them (local dev,
// `npm run build`) nothing below applies.
const forPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // The dev server's on-disk cache once kept serving a stylesheet that was
    // missing a component's classes, across restarts: on a synced folder
    // (OneDrive here) it can miss file changes. Without it `next dev` just
    // compiles fresh on each start.
    turbopackFileSystemCacheForDev: false,
  },
  ...(forPages && {
    output: "export",
    basePath,
    trailingSlash: true,
    // there is no image optimisation server on a static host
    images: { unoptimized: true },
  }),
};

export default nextConfig;
