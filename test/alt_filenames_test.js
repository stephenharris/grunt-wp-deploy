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
      opts: {cwd: 'tmp/checkout/alt-filenames'}
    }, done);
  },

  build_files: function(test) {
    test.expect(2);
	test.ok(grunt.file.exists(path.join('tmp/checkout/alt-filenames/trunk', 'ReadMe.md')), 'The file ‘ReadMe.md’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/alt-filenames/trunk', 'alt-plugin-main-file.php')), 'The file ‘alt-plugin-main-file.php’ should have been copied into the repository.');
    test.done();
  },


  tags: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: 'ls',
      args: ['-1', 'tags'],
      opts: {cwd: 'tmp/checkout/alt-filenames'}
    },function( error, result, code ){
      //C
      var expected = "1.4.0";
      test.equal( result.stdout, expected, 'The deployment repository`s tags are not as expected' )
      test.done();
    });
  },
};
