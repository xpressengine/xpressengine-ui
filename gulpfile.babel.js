import { src, dest, task, series, parallel, watch } from 'gulp'
const $ = require('gulp-load-plugins')()
const argv = require('minimist')(process.argv.slice(2))

const mode = (process.env.NODE_ENV !== 'production') ? 'develoment' : 'production'
let generateSourceMaps = mode !== 'production'
const ignore = [
  '!**/node_modules'
]

if (process.env.SOURCEMAPS === 'true' || process.env.SOURCEMAPS === '1') {
  generateSourceMaps = true
}

const taskSass = function () {
  generateSourceMaps = (mode !== 'production' && !argv.p)

  return src(['scss/*.scss', ...ignore])
    .pipe($.if(generateSourceMaps, $.sourcemaps.init()))
    .pipe($.sass({outputStyle: 'compressed'}).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      cascade: false
    }))
    .pipe($.if(generateSourceMaps, $.sourcemaps.write()))
    .pipe(dest('dist/css'))
}
taskSass.displayName = 'sass'
taskSass.description = 'SASS'

const taskLintSass = function () {
  return src(['scss/**/*.scss', ...ignore])
    .pipe($.stylelint({
      reporters: [
        { formatter: 'string', console: true }
      ]
    }))
}
taskLintSass.displayName = 'lint:sass'

const taskFixSass = function () {
  return src(['scss/**/*.scss', ...ignore])
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

const taskWatch = function () {
  watch(['scss/*.scss', ...ignore], parallel(taskSass))
}
taskWatch.displayName = 'watch'

const taskBuild = series(taskSass)
taskBuild.displayName = 'build'
taskBuild.flags = {
  '-p': 'Production mode (minify)'
}

task('default', series(taskSass))
task(taskBuild)

task('lint', series(taskLintSass))
task(taskLintSass)
task(taskFixSass)
task(taskSass)


task(taskWatch)
