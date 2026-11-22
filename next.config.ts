import type { NextConfig } from "next";

/**
 * FightLab is een volledig client-side app (local-first + optionele Supabase-sync).
 * Daarom bouwen we een statische export (`out/`) die op elke statische host draait
 * (Vercel, Netlify, Cloudflare Pages, GitHub Pages).
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
