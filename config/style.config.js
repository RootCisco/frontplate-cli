'use strict';
module.exports = {
    type: 'sass',
    src: `${FRP_SRC}/style/**/*.{scss,styl,stylus}`,  // 読み込むscss
    dest: `${FRP_DEST}/assets/css`,  // 出力先
    outputStyle: 'compact',
    sourceMap: true,
    plugins: [  // postcssプラグイン
        require('autoprefixer')({   // autoprefixer(https://github.com/postcss/autoprefixer)
            browsers: [
              '> 3% in JP'
            ]
        })
    ],
    noGuide: false,
    styleguide: {
        title: 'StyleGuide',
        verbose: false,
        clean: true,
        params: {},
        css: `../${FRP_DEST}/assets/css/style.css`
        // script: '../public/assets/js/app.js',
    }
};
