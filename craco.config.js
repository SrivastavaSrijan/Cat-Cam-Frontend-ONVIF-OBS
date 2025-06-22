const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        // Only inject service worker in production builds
        ...(process.env.NODE_ENV === 'production' ? [
          new InjectManifest({
            swSrc: './public/sw.js',
            dontCacheBustURLsMatching: /\.\w{8}\./,
            exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
            maximumFileSizeToCacheInBytes: 5000000,
          }),
        ] : []),
      ],
    },
  },
};
