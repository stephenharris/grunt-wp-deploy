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

  // Initialize an svn repository (for tests)
  grunt.registerMultiTask('init_repo', 'Initialize a svn repository in a directory.', function() {
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

    // Configurations to be run (and then tested).
    wp_deploy: {
		  first: { //First standard test
		  	options: {
		  		svn_url: 'file://' + path.resolve() + '/tmp/repo/standard/',
		  		plugin_slug: 'standard',
		  		svn_user: 'stephenharris',  
		  		skip_confirmation: true,
		  		build_dir: 'test/fixtures/first/build', //relative path to your build directory
		  		assets_dir: 'test/fixtures/first/assets', //relative path to your assets directory (optional).
		  		tmp_dir: 'tmp/checkout',
		  		force_interactive: false,
		  	}
		  },
		  second: { //Second commit (standard test)
		  	options: {
		  		svn_url: 'file://' + path.resolve() + '/tmp/repo/standard/',
		  		plugin_slug: 'standard',
		  		svn_user: 'stephenharris',  
		  		skip_confirmation: true,
		  		build_dir: 'test/fixtures/second/build', //relative path to your build directory
		  		assets_dir: 'test/fixtures/second/assets', //relative path to your assets directory (optional).
		  		tmp_dir: 'tmp/checkout',
		  		force_interactive: false,
		  	}
		  },
		  alt_filenames: { //Testing deployments using alternative readme file (i.e. not readme.txt) and alternative main plug-in file.
		  	options: {
		  		svn_url: 'file://' + path.resolve() + '/tmp/repo/alt-filenames/',
		  		plugin_slug: 'alt-filenames',
		  		plugin_main_file: 'alt-plugin-main-file.php',
		  		svn_user: 'stephenharris',  
		  		skip_confirmation: true,
		  		build_dir: 'test/fixtures/alt-filenames/build', //relative path to your build directory
		  		assets_dir: false,
		  		tmp_dir: 'tmp/checkout',
		  		force_interactive: false,
		  	}
		  },
      version_mismatch: { //Testing version check of readme.txt 'stable' tag and plugin version should be skipped when deploy_tag is false.
        options: {
          svn_url: 'file://' + path.resolve() + '/tmp/repo/version-mismatch',
          plugin_slug: 'version-mismatch',
          svn_user: 'stephenharris',
          skip_confirmation: true,
          build_dir: 'test/fixtures/version-mismatch/build', //relative path to your build directory
          tmp_dir: 'tmp/checkout',
          force_interactive: false,
          deploy_tag:false
        }
      },
      stable_tag_in_list: { //Testing deployments using alternative readme file (i.e. not readme.txt) and alternative main plug-in file.
		  	options: {
		  		svn_url: 'file://' + path.resolve() + '/tmp/repo/stable-tag-in-list',
		  		plugin_slug: 'stable-tag-in-list',
		  		plugin_main_file: 'stable-tag-in-list.php',
		  		svn_user: 'stephenharris',
		  		skip_confirmation: true,
		  		build_dir: 'test/fixtures/stable-tag-in-list/build', //relative path to your build directory
		  		assets_dir: false,
		  		tmp_dir: 'tmp/checkout',
		  		force_interactive: false,
		  	}
		  }
    },

	  clean: {
      all: ['tmp'],
	  	repo: ['tmp/repo'],
	  	checkout_standard: ['tmp/checkout/standard'],
	  	checkout_alt_filenames: ['tmp/checkout/alt-filenames'],
      checkout_version_mismatch: ['tmp/checkout/version-mismatch'],
      stable_tag_in_list: ['tmp/checkout/stable-tag-in-list']
	  },

	  // Initialise the repositories we use in the tests
    init_repo: {
      standard: {
        dest: 'tmp/repo/standard'
      },
      alt_filenames: {
        dest: 'tmp/repo/alt-filenames'
      },
      version_mismatch:
      {
        dest: 'tmp/repo/version-mismatch'
      },
      stable_tag_in_list: {
        dest: 'tmp/repo/stable-tag-in-list'
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
  grunt.registerTask('test', [ 'jshint', 'functional_test'] );
  
  grunt.registerTask('functional_test', [
      'clean', 'init_repo',
      'wp_deploy:first', 'clean:checkout_standard', 'wp_deploy:second',
      'wp_deploy:alt_filenames',
      'wp_deploy:version_mismatch',
      'wp_deploy:stable_tag_in_list',
      'nodeunit'
  ]);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test']);

};
