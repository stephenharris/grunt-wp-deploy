'use strict';

var grunt = require('grunt');
var path = require('path');

/**
 * This test is for checking that the appropriate readme file is found (i.e. when readme.txt
 * is not available), and that an alternative main plugin file is found.
 */
exports.wp_deploy = {
  setUp: function(done) {
    grunt.util.spawn({
      cmd: 'svn',
      args: ['up'],
      opts: {cwd: 'tmp/checkout/stable-tag-in-list/trunk'}
    }, done);
  },

  build_files: function(test) {
    test.expect(2);
	  test.ok(grunt.file.exists(path.join('tmp/checkout/stable-tag-in-list/trunk', 'ReadMe.md')), 'The file ‘ReadMe.md’ should have been copied into the repository.');
	  test.ok(grunt.file.exists(path.join('tmp/checkout/stable-tag-in-list/trunk', 'stable-tag-in-list.php')), 'The file ‘alt-plugin-main-file.php’ should have been copied into the repository.');
    test.done();
  },

  tags: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: 'svn',
      args: ['list', 'file://' + path.resolve() + '/tmp/repo/stable-tag-in-list/tags'],
    },function( error, result, code ){
      var expected = "1.2.3/";
      test.equal( result.stdout, expected, 'The deployment repository`s tags are not as expected' )
      test.done();
    });
  },
};
