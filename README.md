# frp-cli-custom
既存のfrontplate-cliをForkして変更を加えたもの。<br>
古くなっていたモジュールをアップデートして調整してみた。(使えるには使えると思います)

**install**
```bash
npm i frp-cli-custom -g
```

<br>

## [変更点]
### 1. ejs, sassベース、pug, stylusベースのどちらにするかをcreateコマンドで選べるように。

このような感じで選択できます。

<img width="404" alt="2018-06-26 13 32 53" src="https://user-images.githubusercontent.com/11202121/41889717-f1432f7e-7946-11e8-99b6-b0607c86a0f8.png">

プリセットでもいけます。

```javascript
ejs_sass: frp create {project name} -p ejs_sass
pug_stylus: frp create {project name} -p pug_styl
```

<br>

概要、使い方などはこちらを参照してください。
- Repository: https://github.com/frontainer/frontplate-cli
- Wiki: https://github.com/frontainer/frontplate-cli/wiki

<br>

***wpのテンプレートは関与してないので、あしからず...。**

<br>

### 2. svg-spriteのタスクを追加。（インライン想定）

*外部ファイル読み込み想定にするとpolyfillが必要になってくるためあえてインラインのみにしてます。（現状は複数対応しておりません）

<br>

createタスクで作成したプロジェクトに'svg-sprite'というディレクトリがあります。

svg-sprite配下に任意のsvgを入れてください。
svgSpriteタスクでsvgスプライトがviewディレクトリ配下に_svg-sprite.{ejs, pug}ファイルが作成されます。

あとは任意の箇所で
```
// ejs_sass
<% include view/svg/_svg-sprite %>

// pug_styl
include view/svg/_svg-sprite
```

前と同様にfrp.config.jsのsvgSprite:{}内で設定調整できます。
```javascript
/*　default settings */
{
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
```

<br>

## License
MIT License.

Copyright (c) 2015 frontainer<br>
Released under the MIT license<br>
http://opensource.org/licenses/mit-license.php
