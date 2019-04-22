'use strict';
module.exports = {
    src: `${FRP_SRC}/style/**/*.{scss,styl,stylus}`,  // 読み込むscss
    dest: `${FRP_DEST}/assets/css`,  // 出力先
    outputStyle: 'compact',
    sourceMap: true,
    plugins: [  // postcssプラグイン
        require('autoprefixer')({   // autoprefixer(https://github.com/postcss/autoprefixer)
            browsers: [
                'last 2 versions',
                'ie >= 10',
                'ios >= 10',
                'Android >= 4.4'
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
    }
};
