const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new InjectManifest({
          swSrc: './public/sw.js',
          dontCacheBustURLsMatching: /\.\w{8}\./,
          exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
          maximumFileSizeToCacheInBytes: 5000000,
        }),
      ],
    },
  },
};
