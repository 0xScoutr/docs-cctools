import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  // A static site for Cloudflare Pages: every page is an HTML file in out/.
  output: 'export',
  // URLs stay as Mintlify served them: /network/network-stats, no slash.
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // The pages and docs.json live one folder up, at the repository root.
  turbopack: { root: resolve(here, '..') },
  outputFileTracingRoot: resolve(here, '..'),
};

export default withMDX(config);
