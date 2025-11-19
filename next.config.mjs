import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Webpack configuration for bundle size tracking and code splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add bundle size warnings for client bundles
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // D3 chunk (large library)
            d3: {
              name: 'd3',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](d3|topojson-client)[\\/]/,
              priority: 30,
            },
            // React Query chunk
            reactQuery: {
              name: 'react-query',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 25,
            },
            // Radix UI components (can be large)
            radix: {
              name: 'radix-ui',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 15,
            },
          },
        },
      }
    }

    return config
  },
}

export default withBundleAnalyzer(nextConfig)
