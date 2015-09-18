module.exports = function(grunt) {

	var cfgCache = {};

	function Config() {

		var cfg, config = {};
		var view, livereloadPort, modules, module, scripts, script, allScripts = [];

		cfg = grunt.file.readJSON('gruntfile.cfg');

		/**
		* Fix paths to JS modules and scripts
		*/
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			/**
			* Fix modules paths
			*/
			modules = cfg.views[view].js.modules || [];
			for ( module in modules ) {
				if ( ! modules.hasOwnProperty(module) ) continue;
				modules[module] = 'src/modules/js/' + modules[module] + '.js';
			}
			cfg.views[view].js.modules = modules;

			/**
			* Fix scriptts paths
			*/
			scripts = cfg.views[view].js.scripts || [];
			for ( script in scripts ) {
				if ( ! scripts.hasOwnProperty(script) ) continue;
				scripts[script] = 'src/' + view + '/js/' + scripts[script] + '.js';
			}
			cfg.views[view].js.scripts = scripts;
		}

		/**
		* JS Hint
		*/
		config.jshint = {
			options: {
				bitwise: true,
				camelcase: true,
				eqeqeq: true,
				forin: true,
				latedef: 'nofunc',
				newcap: true,
				noarg: true,
				noempty: true,
				nonbsp: true,
				quotmark: 'single',
				undef: true,
				unused: false,
				strict: true,
				trailing: true,
				browser: true,
			}
		};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			if ( cfg.views[view].js.modules.length ) {
				config.jshint['modules_'+view] = cfg.views[view].js.modules;
			}
			if ( cfg.views[view].js.scripts.length ) {
				config.jshint[view] = cfg.views[view].js.scripts;
			}
		}


		/**
		* Concat
		*/
		config.concat = {
			options: {
				separator: ';'
			}
		};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			allScripts = [];

			modules = cfg.views[view].js.modules;
			for ( module in modules ) {
				if ( ! modules.hasOwnProperty(module) ) continue;
				allScripts.push(modules[module]);
			}

			scripts = cfg.views[view].js.scripts;
			for ( script in scripts ) {
				if ( ! scripts.hasOwnProperty(script) ) continue;
				allScripts.push(scripts[script]);
			}

			if ( ! allScripts.length ) continue;

			config.concat[view] = {
				src: allScripts,
				dest: 'public/assets/'+ view +'/js/scripts.js',
			};
		}


		/**
		* Uglify
		*/
		config.uglify = {};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			if ( ! cfg.views[view].js.minify ) continue;

			config.uglify[view] = {
				src: 'public/assets/'+ view +'/js/scripts.js',
				dest: 'public/assets/'+ view +'/js/scripts.js',
			};
		}


		/**
		* LESS
		*/
		config.less = {};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			config.less[view] = {files: {}};
			config.less[view].files['public/assets/'+ view +'/css/style.css'] = 'src/'+ view +'/less/style.less';
		}


		/**
		* Autoprefixer
		*/
		config.autoprefixer = {
			options: {
				browsers: ['last 2 version', 'ie 9'],
				map: false,
			}
		};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			config.autoprefixer[view] = {
				src: 'public/assets/'+ view +'/css/style.css',
				dest: 'public/assets/'+ view +'/css/style.css',
			};
		}


		/**
		* CSS Minifier
		*/
		config.cssmin = {files:[]};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			if ( ! cfg.views[view].less.minify ) continue;

			config.cssmin[view] = {
				files: [
					{ src: 'public/assets/'+ view +'/css/style.css', dest: 'public/assets/'+ view +'/css/style.css' }
				]
			};
		}


		/**
		* SVG Store
		*/
		config.svgstore = {
			options: {
				prefix: 'svg-',
				cleanup: true,
				svg: {
					style: 'display:none',
				},
			}
		};
		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			config.svgstore[view] = {files: {}};
			config.svgstore[view].files['public/assets/'+ view +'/svg/shapes.svg'] = ['src/'+ view +'/svg/*.svg'];
		}

		/**
		* Watch
		*/
		config.watch = {
			options: {
				spawn: false,
				livereload: cfg.livereloadPort || 35730,
			}
		};

		for ( view in cfg.views ) {
			if ( ! cfg.views.hasOwnProperty(view) ) continue;

			config.watch[view + '_css'] = {
				files: ['src/'+ view +'/less/*.less'],
				tasks: ['less:'+ view, 'autoprefixer:'+ view]
			};
			if ( cfg.views[view].less.minify )
				config.watch[view + '_css'].tasks.push('cssmin:'+ view);

			config.watch[view + '_js'] = {
				files: ['src/'+ view +'/js/**/*.js'],
				tasks: ['jshint:'+ view, 'concat:'+ view]
			};
			if ( cfg.views[view].js.minify )
				config.watch[view + '_js'].tasks.push('uglify:'+ view);

			config.watch[view + '_svg'] = {
				files: ['src/'+ view +'/svg/*.svg'],
				tasks: ['svgstore:'+ view]
			};

			config.watch[view + '_views'] = {files: []};
			for ( var tpl in cfg.views[view].views )
				config.watch[view + '_views'].files.push(cfg.views[view].views[tpl]);
		}

		config.watch.less_modules = {
			files: ['src/modules/less/*.less'],
			tasks: ['less', 'cssmin', 'autoprefixer']
		};

		config.watch.jshint_modules = {
			files: ['src/modules/js/*.js'],
			tasks: ['jshint', 'concat', 'uglify'],
		};

		config.watch.reload_config = {
			files: ['src/config.json'],
			tasks: ['reload_config', 'cssmin', 'jshint', 'concat', 'uglify'],
		};

		return config;
	}

	grunt.config.init(Config());

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-svgstore');

	grunt.registerTask('reload_config', "Reload config", function() {
		grunt.config.data = Config();
    	console.log("Reloading config");
	});

	grunt.registerTask('config', "Print config", function() {
    	console.log(JSON.stringify(Config(), null, 4));
	});

	grunt.registerTask('default', ['watch']);

};