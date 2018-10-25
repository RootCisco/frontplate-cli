'use strict'
const webpack = require('webpack')
const entries = require('webpack-entries')
const path = require('path')
const util = require('../lib/util/util')
const localConfig = path.join(process.cwd(), '.eslintrc')
const globalConfig = path.join(__dirname, '/../.eslintrc')
const WebpackBuildNotifierPlugin = require('webpack-build-notifier')
/**
 * webpack config
 * url: https://webpack.github.io/docs/configuration.html
 */
module.exports = {
  entry: entries(`./${FRP_SRC}/js/!(_*|*spec).js`, true),
  output: {
    path: FRP_DEST + '/assets/js',
    publicPath: '/assets/js/',
    filename: '[name].js',
    sourceMapFilename: 'maps/[name].map',
    jsonpFunction: 'fr'
  },
  resolve: {
    modules: [
      `${FRP_SRC}/js`,
      path.join(process.cwd(), 'node_modules'),
      path.join(__dirname, '../node_modules'),
      'node_modules'
    ]
  },
  resolveLoader: {
    modules: [
      path.join(process.cwd(), 'node_modules'),
      path.join(__dirname, '../node_modules'),
      'node_modules'
    ]
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'eslint-loader', enforce: 'pre' },
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.(glsl|frag|vert|vs|fs)$/, loader: 'webpack-glsl-loader' }
    ]
  },
  plugins: [
    new WebpackBuildNotifierPlugin({
      title: 'frp task script',
      suppressSuccess: true
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        eslint: {
          configFile: util.exists(localConfig) ? localConfig : globalConfig,
          failOnError: true
        }
      }
    })
  ],
  watchOptions: {
    ignored: /node_modules/
  },
  performance: {
    hints: false
  }
}
