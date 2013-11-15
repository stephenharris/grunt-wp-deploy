/*
 * grunt-wp-deploy
 * https://github.com/stephenharris/grunt-wp-deploy
 *
 * Copyright (c) 2013 Stephen Harris
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

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
	deploy: { 
	}
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['wp_deploy'] );

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
