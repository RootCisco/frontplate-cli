# frp-cli-custom
既存のfrontplate-cliをForkして変更を加えたもの。<br>
古くなっていたモジュールをアップデートして調整してみた。

**[変更点]**<br>
- ejs, sassベース、pug, stylusベースのどちらにするかをcreateコマンドで選べるように。

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

## License
MIT License.

Copyright (c) 2015 frontainer<br>
Released under the MIT license<br>
http://opensource.org/licenses/mit-license.php
