/** @type {import('next').NextConfig} */
const base = {
  // typescript: { ignoreBuildErrors: true }, // Réactivé
  // eslint: { ignoreDuringBuilds: true }, // Réactivé
};

async function headers() {
  if (process.env.NEXT_PUBLIC_DIAG_MODE === '1') {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:",
      "style-src 'self' 'unsafe-inline' https: http:",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https: http:",
      "connect-src 'self' https: http: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
    ].join('; ');
    return [
      { source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: csp }] },
    ];
  }
  return []; // no extra headers outside DIAG
}

const nextConfig = {
  ...base,
  async headers() {
    const extra = await headers();
    // If there was a previous headers() in the project, it is intentionally bypassed during DIAG.
    return extra;
  },
};

module.exports = nextConfig;