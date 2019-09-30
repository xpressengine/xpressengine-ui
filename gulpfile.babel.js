import { src, dest, task, series, parallel, watch } from 'gulp'

const $ = require('gulp-load-plugins')()
const argv = require('minimist')(process.argv.slice(2))

const mode = (process.env.NODE_ENV !== 'production') ? 'develoment' : 'production'
let generateSourceMaps = mode !== 'production'
const ignore = [
  '!**/node_modules'
]
const banner = ['/**',
  '* @author XEHub <https://www.xehub.io>',
  '* @license LGPL-2.1-or-later',
  '*/',
  ''].join('\n ')

if (process.env.SOURCEMAPS === 'true' || process.env.SOURCEMAPS === '1') {
  generateSourceMaps = true
}

const taskSass = function () {
  generateSourceMaps = (mode !== 'production' && !argv.p)

  return src(['scss/**/*.scss', ...ignore])
    .pipe($.if(generateSourceMaps, $.sourcemaps.init()))
    .pipe($.sass({
      // outputStyle: 'compressed',
      outputStyle: 'expanded',
      includePaths: ['node_modules']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      cascade: false
    }))
    .pipe($.if(generateSourceMaps, $.sourcemaps.write()))
    .pipe($.header(banner))
    .pipe(dest('dist/css'))
}
taskSass.displayName = 'sass'
taskSass.description = 'SASS'

const taskSassPreview = function () {
  generateSourceMaps = (mode !== 'production' && !argv.p)

  return src(['dist/preview/scss/**/*.scss', ...ignore])
    .pipe($.if(generateSourceMaps, $.sourcemaps.init()))
    .pipe($.sass({
      // outputStyle: 'compressed',
      outputStyle: 'expanded',
      includePaths: ['node_modules']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      cascade: false
    }))
    .pipe($.if(generateSourceMaps, $.sourcemaps.write()))
    .pipe($.header(banner))
    .pipe(dest('dist/preview/css'))
}
taskSass.displayName = 'sassPreview'
taskSass.description = 'SASS Preview'

const taskLintSass = function () {
  return src(['scss/**/*.scss', ...ignore])
    .pipe($.plumber())
    .pipe($.stylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    }))
}
taskLintSass.displayName = 'lint:sass'

const taskFixSass = function () {
  return src(['scss/**/*.scss', ...ignore])
    .pipe($.plumber())
    .pipe($.stylelint({
      fix: true,
      reporters: [
        { formatter: 'string', console: true }
      ]
    }))
    .pipe(dest('./scss'))
}
taskFixSass.displayName = 'lint:fix-sass'
taskFixSass.description = '.scss 자동 교정'

const taskPosthtml = function () {
  const options = {
    root: './html'
  }

  const plugins = [
    require('posthtml-extend')(options),
    require('posthtml-include')(options)
  ]

  return src(['html/**/*.html', '!**/_*.html', ...ignore])
    .pipe($.posthtml(plugins))
    .pipe(dest('dist/preview'))
}
taskPosthtml.displayName = 'posthtml'

const watchFiles = function () {
  watch(['scss/**/*.scss', ...ignore], series(taskLintSass, taskSass))
  watch(['dist/preview/scss/**/*.scss', ...ignore], series(taskLintSass, taskSassPreview))
  watch(['html/**/*.html', ...ignore], series(taskPosthtml))
}
const taskWatch = series(taskFixSass, taskSass, taskSassPreview, taskPosthtml, watchFiles)
taskWatch.displayName = 'watch'

const taskBuild = series(taskSass)
taskBuild.displayName = 'build'
taskBuild.flags = {
  '-p': 'Production mode (minify)'
}

task('default', parallel(taskSass, taskPosthtml))
task(taskBuild)

task('lint', series(taskLintSass))
task(taskLintSass)
task(taskFixSass)
task(taskSass)

task(taskPosthtml)

task(taskWatch)
