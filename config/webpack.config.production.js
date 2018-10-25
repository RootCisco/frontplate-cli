'use strict'
const webpack = require('webpack')
const merge = require('webpack-merge')
const core = require('./webpack.core')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
/**
 * webpack config for production
 * url: https://webpack.github.io/docs/configuration.html
 */
module.exports = merge(core, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                'env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'IE 11']
                  },
                  modules: false,
                  useBuiltIns: true
                }
              ]
            ]
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
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
          ecma: 5,
          ie8: true
        }
      })
    ]
  },
  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin()
  ]
})
