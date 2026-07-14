import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Konsumera @elevantly/core direkt från TypeScript-källan. Håller domän-
  // och AI-lagret som en riktig paketgräns utan ett separat byggsteg.
  transpilePackages: ["@elevantly/core"],
};

export default nextConfig;
