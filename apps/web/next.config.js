/** @type {import('next').NextConfig} */
const nextConfig = {
  // @prema/compatibility is a source-only workspace package (exports -> ./src/index.ts).
  // Next compiles its TypeScript directly; there is no dist build to keep in sync.
  transpilePackages: ['@prema/compatibility'],

  // The OG route reads its fonts from disk. Without this they are pruned from
  // the serverless output and the route 500s in production while working
  // perfectly in dev — the worst kind of failure.
  outputFileTracingIncludes: {
    '/api/og': ['./app/api/og/fonts/**'],
  },
};

export default nextConfig;
