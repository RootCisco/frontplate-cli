'use strict';
const fs = require('fs-extra');
const path = require('path');
const Spritesmith = require('spritesmith');
// const json2css = require('json2css');
const templater = require('spritesheet-templates');
const ora = require('ora');
const Rx = require('rxjs/Rx');
const util = require('../util/util');
const timer = require('../util/timer');
const ejs = require('ejs');

/**
 * sprite task
 * @param sprites{object[]} sprite config object
 * @returns {Rx.Observable}
 */
module.exports = function (sprites) {
  timer.start('sprite');
  const spinner = ora('[build] sprite').start();

  let observables = sprites.map((sprite) => {
    let src = util.getPath(sprite.src);
    return generate(src, sprite);
  });
  if (observables.length === 0) {
    return Rx.Observable.of([]);
  }
  let obs = Rx.Observable.combineLatest(observables).share();
  obs.subscribe(() => {
    spinner.succeed();
    timer.end('sprite');
  }, () => {
    spinner.fail();
  });
  return obs;
};

/**
 * generate sprite image & css
 * @param src{string} directory of sprites
 * @param config{object} spritesmith options(https://www.npmjs.com/package/spritesmith)
 * @returns {Rx.Observable}
 */
function generate(src, config) {
  return Rx.Observable.create((observer) => {
    let op = Object.assign({}, config, { src });
    Spritesmith.run(op, (err, result) => {
      if (err) return observer.error(err);
      let coordinates = Object.keys(result.coordinates);
      if (coordinates.length === 0) {
        return observer.next([]);
      }
      let spriteParams = coordinates.map((key) => {
        let data = result.coordinates[key];
        let ext = path.extname(key);
        let filename = path.basename(key, ext);
        return {
          name: filename,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height
        };
      });
      spriteParams = {
        sprites: spriteParams,
        spritesheet: {
          width: result.properties.width,
          height: result.properties.height,
          image: config.imgPath || 'images/sprite.png'
        }
      };
      output(result, spriteParams, config).subscribe((res) => {
        observer.next(res);
      }, (e) => {
        observer.error(e);
      });
    });
  });
}

function output(result, spriteParams, config) {
  let ext = (FRP_TPL_TYPE === 'ejs_sass') ? 'scss' : 'styl';
  let destImgPath = config.destImage || 'images/sprite.png';
  let destCSSPath = `${config.destCSS}.${ext}` || `src/scss/sprites/_sprite.${ext}`;

  let filename = path.basename(destCSSPath, path.extname(destCSSPath)).replace(/^_/, '');
  templater.addTemplate('style-beauty', (args) => {
    let templatePath = config.template || path.join(__dirname, `../../template/sprite/sprite-${ext}.ejs`);
    const template = fs.readFileSync(templatePath);
    return ejs.render(template.toString(), {
      items: args.items,
      options: args.options,
      filename: filename,
      config: config
    });
  });

  let css = templater(spriteParams, {
    format: 'style-beauty',
    cssSelector: function (item) {
      return `${filename}-${item}`;
    }
  });


  let imgObs = Rx.Observable.create((observer) => {
    fs.outputFile(destImgPath, result.image, (err) => {
      if (err) return observer.error(err);
      observer.next(destImgPath);
    });
  });
  let cssObs = Rx.Observable.create((observer) => {
    fs.outputFile(destCSSPath, css, (err) => {
      if (err) return observer.error(err);
      observer.next(destCSSPath);
    });
  });
  return Rx.Observable.combineLatest(imgObs, cssObs);
}
