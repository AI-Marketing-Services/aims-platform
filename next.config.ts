import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enable browser XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Restrict DNS prefetching
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Permissions policy — disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS — enforce HTTPS for 1 year (only in production)
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
  // Content-Security-Policy — allow Clerk, Stripe, AI SDK, and our CDN assets
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Clerk + Stripe + inline required by Next.js
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.aimseos.com https://js.stripe.com https://accounts.google.com https://client.crisp.chat",
      // Styles: self + unsafe-inline (required by Tailwind / shadcn)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com https://client.crisp.chat",
      // Images: self + Clerk CDN + Clearbit logos + data URIs
      "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://logo.clearbit.com https://lh3.googleusercontent.com https://image.crisp.chat https://client.crisp.chat https://storage.crisp.chat",
      // Connect: API calls to AI services, Stripe, Clerk
      "connect-src 'self' https://*.clerk.com https://clerk.aimseos.com https://api.stripe.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.tavily.com https://upstash.io https://*.upstash.io wss://ws.clerk.com https://client.crisp.chat https://storage.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat",
      // Frames: Stripe embedded UI only
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://game.crisp.chat https://player.vimeo.com",
      // Workers
      "worker-src 'self' blob:",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["pdfkit"],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "framer-motion",
      "@dnd-kit/core",
      "@dnd-kit/utilities",
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Cache static assets aggressively
        source: "/integrations/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache logo and favicons
        source: "/:path(logo\\.png|favicon\\.ico|apple-icon\\.png|og-image\\.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        // Cache partner assets
        source: "/partners/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache resource files
        source: "/resources/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        // Prevent search engines from indexing API routes
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Allow embed routes to be loaded in iframes on Mighty Networks and external sites
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
