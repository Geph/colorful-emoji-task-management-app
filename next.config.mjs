/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/task"
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || `${basePath}/`

const nextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? assetPrefix : undefined,
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}

export default nextConfig
