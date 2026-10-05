/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Keep production builds focused on type-safety; lint runs via `npm run lint`.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Prisma's WASM query compiler is loaded from disk at runtime. Without
    // this, serverless hosts (Amplify/Lambda, Vercel) do not copy the .wasm
    // files into the deployment bundle and the first query throws.
    outputFileTracingIncludes: {
      "/**/*": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/runtime/*.wasm",
      ],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
