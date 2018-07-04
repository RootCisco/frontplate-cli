'use strict'
module.exports = {
  src: `${FRP_SRC}/svg-sprite/**/*.svg`,
  dest: `${FRP_SRC}/view`,
  shape: {
    id: {
      separator: ''
    },
    transform: [{
      svgo: {
        plugins: [
          {removeTitle: true},
          {removeUselessDefs: true},
          {removeAttrs: {attrs: ['fill', 'id', 'class', 'data-name']}},
          {removeStyleElement: true},
          {convertPathData: true},
          {convertTransform: true}
        ]
      }
    }]
  },
  mode: {
    symbol: {
      dest: 'svg',
      sprite: '_svg-sprite',
      inline: true
    }
  }
}
