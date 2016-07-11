'use strict';

var grunt = require('grunt');
var path = require('path');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.wp_deploy = {
  setUp: function(done) {
    grunt.util.spawn({
      cmd: 'svn',
      args: ['up'],
      opts: {cwd: 'tmp/checkout/wp-deploy'}
    }, done);
  },

  /**
   * Check the build directory has all the files it should have
   * and that files present in the first build but not the second
   * have been removed. (e.g. to-be-removed.php)
   */
  build_files: function(test) {
    test.expect(5);

    grunt.file.recurse('test/fixtures/second/build', function(abs, root, subdir, file) {
      var relativePath = path.join(subdir || '', file);
      test.ok(grunt.file.exists(path.join('tmp/checkout/wp-deploy/trunk', relativePath)), 'The file ‘' + relativePath + '’ should have been copied into the repository.');
    });

    test.ok(!grunt.file.exists(path.join('tmp/checkout/wp-deploy/trunk', 'to-be-removed.php')), 'The file ‘to-be-removed.php’ should have been removed from the repository.');
    test.done();
  },

  /**
   * Check the asset directory has all the files it should have
   * and that files removed from the second build are have been removed
   */
  assets_files: function(test) {
    test.expect(3);
    test.ok(grunt.file.exists(path.join('tmp/checkout/wp-deploy/assets', 'cat.png')), 'The file ‘cat.png’ should have been copied into the repository.');
    test.ok(grunt.file.exists(path.join('tmp/checkout/wp-deploy/assets', 'wp.png')), 'The file ‘wp.png’ should have been copied into the repository.');
    test.ok(!grunt.file.exists(path.join('tmp/checkout/wp-deploy/assets', 'wp-orange.png')), 'The file ‘wp-orange.png’ should have been removed from the repository.');
    test.done();
  },

  /**
   * Check that all the commit messages are present and in order
   */  
  commit_message: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: "svn",
      args: ['log'],
      opts: {cwd: 'tmp/checkout/wp-deploy'}
    }, function(error, result, code){
      //result.stdout is the commit logs, we need to tidy them up to get the commit messages
      var res = result.stdout.replace(/^((r\d.*)|(-*)|($))/mg,'').replace( /^\s*\n/gm, '' );
      
      var expected = "Committing assets for 1.4.0\nTagging 1.4.0\nCommitting 1.4.0 to trunk\nCommitting assets for 1.3.2\nTagging 1.3.2\nCommitting 1.3.2 to trunk\n\"structure\"\n";
      test.equal( res, expected, 'The deployment repository`s history is not as expected' )
      test.done();
    } );

  },

  /**
   * Check the tags directory contains all the released versions
   */ 
  tags: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: 'ls',
      args: ['-1', 'tags'],
      opts: {cwd: 'tmp/checkout/wp-deploy'}
    },function( error, result, code ){
      //C
      var expected = "1.3.2\n1.4.0";
      test.equal( result.stdout, expected, 'The deployment repository`s tags are not as expected' )
      test.done();
    });
  },
};
