var gulp = require('gulp'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util');

gulp.task('default', function(){
    return gulp.src(['uiBreadcrumbs.js'])
      .on('error', console.log)
      .pipe(uglify().on('error', gutil.log))
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest('.'));
});
