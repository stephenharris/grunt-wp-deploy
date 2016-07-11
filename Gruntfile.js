/*
 * grunt-wp-deploy
 * https://github.com/stephenharris/grunt-wp-deploy
 *
 * Copyright (c) 2013 Stephen Harris
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	
	var path = require('path');

  grunt.registerMultiTask('init_repo', 'Initialize a git repository in a directory.', function() {
    var dest = this.files[0].dest;
	var destAbs = path.resolve() + '/' + dest;
	grunt.config.set('_svnURl', destAbs );

    if (!grunt.file.exists(dest)) {
      grunt.file.mkdir(dest);
    }

    else if (!grunt.file.isDir(dest)) {
      grunt.fail.warn('A source directory is needed.');
      return false;
    }

    function cmd(command, args) {
      return function(cb) {
        grunt.log.writeln('Running ' + command + ' ' + args.join(' ').green + ' in ' + dest );
        grunt.util.spawn({
          cmd: command,
          args: args,
          opts: {cwd: dest}
        }, cb);
      };
    }

    var done = this.async();


    grunt.util.async.series([
      cmd('svnadmin', ['create', '.']),
      cmd('mkdir', ['trunk', 'tags', 'assets', 'branches']),
      cmd('svn', ['import', '.', 'file://' + destAbs, '-m"structure"']),
    ], done);


  });

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
      ],
      options: {
        jshintrc: '.jshintrc',
	reporter: require('jshint-stylish'),
      },
    },

    // Configuration to be run (and then tested).
    wp_deploy: {
		first: { 
			options: {
				svn_url: ' file://' + path.resolve() + '/tmp/repo/',
				plugin_slug: 'wp-deploy',
				svn_user: 'stephenharris',  
				skip_confirmation: true,
				build_dir: 'test/fixtures/first/build', //relative path to your build directory
				assets_dir: 'test/fixtures/first/assets', //relative path to your assets directory (optional).
				tmp_dir: 'tmp/checkout'
			}
		},
		second: { 
			options: {
				svn_url: ' file://' + path.resolve() + '/tmp/repo/',
				plugin_slug: 'wp-deploy',
				svn_user: 'stephenharris',  
				skip_confirmation: true,
				build_dir: 'test/fixtures/second/build', //relative path to your build directory
				assets_dir: 'test/fixtures/second/assets', //relative path to your assets directory (optional).
				tmp_dir: 'tmp/checkout'
			}
		}
    },

	clean: {
		repo: ['tmp/repo'],
		checkout: ['tmp/checkout']
	},

    init_repo: {
      main: {
        dest: 'tmp/repo'
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', [ 'clean', 'jshint', 'init_repo', 'wp_deploy:first', 'clean:checkout', 'wp_deploy:second', 'nodeunit'] );

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test']);

};
