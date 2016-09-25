var gulp = require('gulp');
var gutil = require('gulp-util');
var guglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');

var colors = {
  success : gutil.colors.green,
  error : gutil.colors.bgRed.bold,
  info : gutil.colors.cyan,
};

function compile(watch) {
  var ts = colors.info('Bundled') + ' main.js';
  var bundler = browserify('./main.js', { debug: true })
    .transform(babelify.configure({
      comments: false,
    }));

  if (watch) {
    bundler = watchify(bundler);
    bundler.on('update', () => {
      console.log('Recompiling');
      rebundle();
    });
  }

  function rebundle() {
    console.time(ts);
    return bundler.bundle()
      .on('error', (err) => gutil.log(colors.error('Error:'), err))
      .on('end', () => console.timeEnd(ts))
      .pipe(source('main.js'))
      .pipe(buffer())
      //.pipe(guglify({ compress: true }))
      .pipe(gulp.dest('./dist'));
  }

  return rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('build', () => compile());
gulp.task('watch', () => watch());

gulp.task('default', ['build']);
