'use strict'
const webpack = require('webpack')
const merge = require('webpack-merge')
const core = require('./webpack.core')
const TerserPlugin = require('terser-webpack-plugin')
/**
 * webpack config for production
 * url: https://webpack.github.io/docs/configuration.html
 */
module.exports = merge(core, {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            warnings: false,
            drop_console: true
          },
          mangle: {
            keep_fnames: true
          },
          output: {
            beautify: false,
            comments: false
          },
          ecma: 6
        }
      })
    ]
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin()
  ]
})
