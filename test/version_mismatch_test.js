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
      opts: {cwd: 'tmp/checkout/version-mismatch/trunk'}
    }, done);
  },

  build_files: function(test) {
    test.expect(2);
	  test.ok(grunt.file.exists(path.join('tmp/checkout/version-mismatch/trunk', 'readme.txt')), 'The file ‘readme.txt’ should have been copied into the repository.');
	  test.ok(grunt.file.exists(path.join('tmp/checkout/version-mismatch/trunk', 'version-mismatch.php')), 'The file ‘standard.php’ should have been copied into the repository.');
    test.done();
  },


};
