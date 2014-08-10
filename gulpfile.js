var gulp = require('gulp'),
    concat = require('gulp-concat'),
    ngAnnotate = require('gulp-ng-annotate'),
    sourcemaps = require('gulp-sourcemaps');

var plainJsGlobs = [
  // Explicitly load the module first to ensure that it is defined before we attempt to add anything
  // to it
  'src/json-validator.js',
  'src/**/*.js',
  // Don't include tests in the build
  '!src/**/*_test.js'
];

gulp.task('js', function () {
  gulp.src(plainJsGlobs)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(concat('json-validator.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.'));
});

gulp.task('watch', ['js'], function () {
  gulp.watch(plainJsGlobs, ['js']);
});