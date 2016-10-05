var gulp = require('gulp');
var fs = require('fs');
var merge = require('merge2');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var less = require('gulp-less');
var sass = require('gulp-sass');
var cleancss = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');
var config = require('js-yaml').safeLoad(fs.readFileSync('rockety.yml', 'utf8'));

gulp.task('config', function () {
    console.log(JSON.stringify(config, null, 4));
});

function css(config) {
    var stream, vendors = [], vendor, css;

    (config.css.vendor || []).forEach(function (item) {
        vendors.push('./src/vendor/' + item);
    });
    vendor = gulp.src(vendors);

    if (config.css.styles) {
        css = merge(
            gulp.src(config.css.styles.less ? config.source + '/less/' + config.css.styles.less : []).pipe(less()),
            gulp.src(config.css.styles.sass ? config.source + '/sass/' + config.css.styles.sass : []).pipe(sass())
        ).pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }));
    }

    stream = merge(vendor, css || gulp.src([]));
    if (config.css.sourcemap) {
        stream = stream.pipe(sourcemaps.init());
    }
    if (config.css.minify) {
        stream = stream.pipe(cleancss());
    }
    stream = stream.pipe(concat('style.css'));
    if (config.css.sourcemap) {
        stream = stream.pipe(sourcemaps.write());
    }
    return stream.pipe(gulp.dest(config.dest + '/css'));
}

function svg(config) {
    return gulp.src(config.source + '/svg/*.svg')
        .pipe(rename({prefix: 'shape-'}))
        .pipe(svgmin())
        .pipe(svgstore())
        .pipe(cheerio({
            run: function ($) {
                $('svg').attr('style', 'display:none');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(rename('shapes.svg'))
        .pipe(gulp.dest(config.dest + '/svg'));
}

config.forEach(function (source) {
    gulp.task('css:' + source.source, function () {
        return css(source)
    });
    gulp.task('svg:' + source.source, function () {
        return svg(source)
    });
});