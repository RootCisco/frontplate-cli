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
  lint(config.type);

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
 * Selected Linter (sass or stylus)
 * @param styleType{string} style files type 'sass' or 'sylus'
 */
function lint(styleType) {
  let lintFile = (styleType === 'sass') ? '.sass-lint.yml' : '.stylintrc';
  let configPath = path.join(process.cwd(), lintFile);
  if(!util.exists(configPath)) configPath = path.join(__dirname, `../../${lintFile}`);
  switch(styleType) {
    case 'sass':
      sassLint(configPath);
      break;
    case 'stylus':
      let stylusDir = `${FRP_SRC}/style/`;
      stylusLint(stylusDir, configPath);
      break;
    default:
      break;
  }
}

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
function stylusLint(dirPath, configPath) {
  stylint(dirPath).create(null, {config: configPath, processExit: true});
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
  let f = filepath.split('.');
  let extention = f[f.length - 1];
  return Rx.Observable.create((observer) => {
    switch(extention) {
      case 'scss':
        sassRender(observer, processor, filepath, outputPath, config);
        break;
      case 'styl':
      case 'stylus':
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
  let style = stylus(str).set('filename', filepath)
  if(sourcemap) style.set('sourcemap', {'comment': false});
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
