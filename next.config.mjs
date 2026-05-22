/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {},
  async headers() {
    // Defensive defaults. CSP is intentionally not set here because the app
    // bootstraps theme/color-scheme via an inline <script dangerouslySetInnerHTML>
    // in app/layout.tsx, which would require either 'unsafe-inline' or a nonce —
    // defer until the layout is refactored.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: "/desempeño",
        destination: "/desempeno",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
