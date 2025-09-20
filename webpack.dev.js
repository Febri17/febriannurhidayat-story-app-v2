// webpack.dev.js
const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }],
      },
    ],
  },
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist'), publicPath: '/' }, // <-- penting
    devMiddleware: { publicPath: '/' }, // ensure bundles served at root
    port: 9000,
    client: { overlay: { errors: true, warnings: true } },
  },
});
