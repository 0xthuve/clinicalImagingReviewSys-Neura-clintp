/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static export
  basePath: "/clinicalImagingReviewSys-Neura-clintp", // 🔁 Replace with your GitHub repo name
  images: {
    unoptimized: true, // Required for next/image with static export
  },
};

export default nextConfig;
