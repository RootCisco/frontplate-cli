'use strict'
const webpack = require('webpack')
const merge = require('webpack-merge')
const core = require('./webpack.core')
/**
 * webpack config
 * url: https://webpack.github.io/docs/configuration.html
 */
module.exports = merge(core, {
  devtool: '#source-map',
  mode: 'development',
  plugins: [
    new webpack.BannerPlugin({
      banner: 'console.warn("This script is development version.");',
      raw: true
    })
  ]
})
