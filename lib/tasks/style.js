'use strict';

const Rx = require('rxjs/Rx');
const fs = require('fs-extra');
const path = require('path');
// const chalk = require('chalk');
const sass = require('node-sass');
const stylus = require('stylus');
const postcss = require('postcss');
const sasslint = require('sass-lint');
const stylint = require('stylus-linter');
const ora = require('ora');
const frontnote = require('frontnote');
const util = require('../util/util');
const timer = require('../util/timer');

/**
 * style tasks (sass/css)
 * @param config{object} style tasks config
 * @returns {Rx.Observable}
 */
module.exports = function (config) {
  timer.start('style');
  const spinner = ora('[build] style').start();

  let processor = postcss(config.plugins || []);
  let files = util.getPath(config.src);
  files = files.filter((filepath) => {
    return (path.basename(filepath).charAt(0) !== '_');
  });

  let observables = files.map((filepath) => {
    let outputPath = util.destPath(config.src, config.dest, filepath, '.css');
    return parse(processor, filepath, outputPath, config);
  });

  if (config.noGuide !== true) {
    let fn = new frontnote(config.styleguide || {});
    observables.push(Rx.Observable.create((obs) => {
      fn.render(config.src).subscribe(() => {
        obs.next([]);
      }, () => {
        obs.complete()
      }, (e) => {
        obs.error(e)
      });
    }));
  }

  let obs = Rx.Observable.combineLatest(observables).share();
  obs.subscribe(() => {
    spinner.succeed();
    timer.end('style');
  }, (e) => {
    spinner.fail();
  });
  return obs;
};

/**
 * Sass Lint
 * @param configPath{string} Sass lint setting path
 */
function sassLint(configPath) {
  let result = sasslint.lintFiles(null, {}, configPath);
  sasslint.outputResults(result);
}

/**
 * Stylus Lint
 * @param dirPath{string} Directory path containing styl or sylus files
 * @param configPath{string} Stylus lint setting path
 */
function stylusLint(configPath) {
  let dirPath = `${FRP_SRC}/style/`;
  stylint(dirPath).create({}, {config: configPath, processExit: true});
}

/**
 * scss and stylus to css
 * @param processor{PostCSSProcessor} postcss processor object
 * @param filepath{string} scss file path
 * @param outputPath{string} dest path
 * @param config{object} style config ../config/style.congfig.js
 * @returns {Rx.Observable}
 */
function parse(processor, filepath, outputPath, config) {
  let tplType = FRP_TPL_TYPE;
  let lintFile = (tplType === 'ejs_sass') ? '.sass-lint.yml' : '.stylintrc';
  let configPath = util.getOutsideConfig(lintFile);
  return Rx.Observable.create((observer) => {
    switch(tplType) {
      case 'ejs_sass':
        sassLint(configPath);
        sassRender(observer, processor, filepath, outputPath, config);
        break;
      case 'pug_styl':
        stylusLint(configPath);
        stylusRender(observer, processor, filepath, outputPath, config);
        break;
      default:
        break;
    }
  });
}

/**
 * sass render
 * @param observer{Rx.Observable} rx obserbale object
 * @param processor{PostCSSProcessor} postcss processor object
 * @param filepath{string} scss file path
 * @param outputPath{string} dest path
 * @param config{object} style config ../config/style.congfig.{production}.js
 */
function sassRender(observer, processor, filepath, outputPath, config) {
  let sourcemap = config.hasOwnProperty('sourceMap') ? config.sourceMap : true;
  sass.render({
    file: filepath,
    outputStyle: config.outputStyle || 'compact',
    sourceMap: sourcemap ? true : false,
    outFile: sourcemap ? outputPath : null,
    importer(url, prev, done) {
      if (url[0] === '~') {
        url = path.resolve('node_modules', url.substr(1));
      }
      return {file: url};
    }
  }, (e, result) => {
    if (e) return observer.error(e);
    let basename = path.basename(outputPath);
    processor.process(result.css.toString(), {
      from: undefined,
      to: basename,
      map: result.map ? {
        annotation: `maps/${basename}.map`,
        prev: result.map.toString()
      } : null
    }).then((result) => {
      output(outputPath, result).subscribe((res) => {
        observer.next(res);
      }, (e) => {
        observer.error(e);
      });
    });
  });
}

/**
 * stylus render
 * @param observer{Rx.Observable} rx obserbale object
 * @param processor{PostCSSProcessor} postcss processor object
 * @param filepath{string} stylus file path
 * @param outputPath{string} dest path
 * @param config{object} style config ../config/style.congfig.{production}.js
 */
function stylusRender(observer, processor, filepath, outputPath, config) {
  let sourcemap = config.hasOwnProperty('sourceMap') ? config.sourceMap : true;
  let str = fs.readFileSync(filepath, 'utf8');
  let style = stylus(str)
    .set('filename', filepath)
    .set('include css', true)
    .set('sourcemap', sourcemap ? {comment: false} : false);
  style.render((err, css) => {
    if(err) return observer.error(err);
    let basename = path.basename(outputPath);
    processor.process(css.toString(), {
      from: undefined,
      to: basename,
      map: style.sourcemap ? {
        annotation: `maps/${basename}.map`,
        prev: style.sourcemap
      } : null
    }).then((result) => {
      output(outputPath, result).subscribe((res) => {
        observer.next(res);
      }, (e) => {
        observer.error(e);
      });
    });
  });
}

/**
 * output css & map
 * @param outputPath{string} dest path
 * @param result{PostCSSResultObject}
 * @returns {Rx.Observable}
 */
function output(outputPath, result) {
  let cssObs = Rx.Observable.create((observer) => {
    fs.outputFile(outputPath, result.css, (err) => {
      if (err) return observer.error(err);
      observer.next(outputPath);
    });
  });
  if (result.map) {
    let basename = path.basename(outputPath);
    let map = path.join(path.dirname(outputPath), 'maps', `${basename}.map`);
    let mapObs = Rx.Observable.create((observer) => {
      fs.outputFile(map, result.map, (err) => {
        if (err) return observer.error(err);
        observer.next(map);
      });
    });
    cssObs = cssObs.combineLatest(mapObs);
  }
  return cssObs;
}
