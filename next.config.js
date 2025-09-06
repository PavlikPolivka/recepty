const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace root warning
  outputFileTracingRoot: process.cwd(),
  // Configure turbopack
  turbopack: {
    root: process.cwd()
  }
};

module.exports = withNextIntl(nextConfig);
