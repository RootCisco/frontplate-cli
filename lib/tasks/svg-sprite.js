'use strict'
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const Rx = require('rxjs/Rx');
const SVGSpriter = require('svg-sprite');
const util = require('../util/util');
const timer = require('../util/timer');
const beautify = require('js-beautify');
const html2pug = require('html2pug');

/**
 * svg-sprite task
 * @param svgSprites{object} svg-sprite config object
 * @returns {Rx.Observable}
 */
module.exports = function (svgSprites) {
  timer.start('svg-sprite');
  const spinner = ora('[build] svg-sprite').start();
  const spriter = new SVGSpriter(svgSprites);

  if (Object.keys(svgSprites).length === 0) {
    return Rx.Observable.of([]);
  }
  let svgFiles = util.getPath(svgSprites.src);
  let observables = spriteGenerate(spriter, svgFiles);

  let obs = Rx.Observable.combineLatest(observables).share();
  obs.subscribe(() => {
    spinner.succeed();
    timer.end('svg-sprite');
  }, () => {
    spinner.fail();
  });
  return obs;
}

/**
 * @param spriter{function} svg-sprite instance
 * @param files{object} svg files
 */
function spriteGenerate(spriter, files) {
  return Rx.Observable.create((observer) => {
    files.map((file) => {
      spriter.add(
        path.resolve(file),
        file,
        fs.readFileSync(file, {encording: 'utf-8'})
      );
    });
    spriter.compile((error, result) => {
      if (error) return observer.error(error);
      let extname = (FRP_TPL_TYPE === 'ejs_sass') ? 'ejs' : 'pug';
      for (let mode in result) {
        for (let resource in result[mode]) {
          let destPath = result[mode][resource].path.replace('.svg', `.${extname}`);
          let contents = htmlShaped(result[mode][resource].contents);
          fs.outputFile(destPath, contents, (err) => {
            if (err) return observer.error(err);
            observer.next(contents);
          });
        }
      }
    });
  });
}

/**
 * @param content{string} svg sprite string
 */
function htmlShaped(content) {
  let type = FRP_TPL_TYPE;
  switch(type) {
    case 'ejs_sass':
      let configPath = util.getOutsideConfig('.jsbeautifyrc');
      let beautifyOption = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      content = beautify.html(content.toString(), beautifyOption);
      break;
    case 'pug_styl':
      content = html2pug(content.toString(), {tabs: true, fragment: true});
      break;
    default:
      break;
  }
  return content;
}
