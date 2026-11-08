import type { NextConfig } from 'next';

// Static export for GitHub Pages: the page is rendered at build time from
// data/snapshots.json. NEXT_BASE_PATH is "/<repo>" when served from a project page.
const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_BASE_PATH || '',
  trailingSlash: true,
};

export default nextConfig;
