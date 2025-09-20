// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        // Copy service worker source to dist root as sw.bundle.js
        {
          from: path.resolve(__dirname, 'src/scripts/sw.js'),
          to: path.resolve(__dirname, 'dist/sw.bundle.js'),
          noErrorOnMissing: true,
        },
        // ensure manifest + offline are copied if they are at project root of public too
        {
          from: path.resolve(__dirname, 'src/public/manifest.webmanifest'),
          to: path.resolve(__dirname, 'dist/manifest.webmanifest'),
          noErrorOnMissing: true,
        },
        {
          from: path.resolve(__dirname, 'src/public/offline.html'),
          to: path.resolve(__dirname, 'dist/offline.html'),
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};
