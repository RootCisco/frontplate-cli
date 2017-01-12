'use strict';
const merge = require('webpack-merge');
const loaderOptionsMerge = require('webpack-loader-options-merge');
/**
 * webpack config
 * url: https://webpack.github.io/docs/configuration.html
 */

module.exports = loaderOptionsMerge(
  merge({
      entry: {
        vendor: ['./src/assets/js/vendor.js']
      }
    },
    require('./build/common'),
    require('./build/babel'),
    require('./build/vendor')
  )
);