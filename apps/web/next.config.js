/** @type {import('next').NextConfig} */
const nextConfig = {
  // @prema/compatibility is a source-only workspace package (exports -> ./src/index.ts).
  // Next compiles its TypeScript directly; there is no dist build to keep in sync.
  transpilePackages: ['@prema/compatibility'],
};

export default nextConfig;
