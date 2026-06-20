import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Geteilte Pakete als TS-Quelle transpilieren (keine Pre-Build-Stufe nötig).
  transpilePackages: ['@offero/core', '@offero/api-client', '@offero/ui'],
  // Lint läuft separat über Turbo (eslint flat config); Next soll beim Build nicht doppelt linten.
  eslint: { ignoreDuringBuilds: true },
  // Monorepo-Root pinnen (es gibt fremde Lockfiles außerhalb; verhindert falsches Tracing).
  outputFileTracingRoot: path.join(dirname, '../../'),
};

export default nextConfig;
