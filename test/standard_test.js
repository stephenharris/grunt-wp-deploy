'use strict';

var grunt = require('grunt');
var path = require('path');

/**
 * This test is for basic standard behaviour of the plugin. Committing changes, including
 * file additions, removals, tagging and commit messages.
 */
exports.wp_deploy = {
  setUp: function(done) {
    grunt.util.spawn({
      cmd: 'svn',
      args: ['up'],
      opts: {cwd: 'tmp/checkout/standard/trunk'}
    }, done);
  },

  /**
   * Check the build directory has all the files it should have
   * and that files present in the first build but not the second
   * have been removed. (e.g. to-be-removed.php)
   */
  build_files: function(test) {
    test.expect(17);
        
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'readme.txt')), 'The file ‘cat.png’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'ReadMe.md')), 'The file ‘ReadMe.md’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'standard.php')), 'The file ‘cat.png’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'this-file-is-added.php')), 'The file ‘cat.png’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'folder/file.php')), 'The file ‘cat.png’ should have been copied into the repository.');
    test.ok(!grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'to-be-removed.php')), 'The file ‘to-be-removed.php’ should have been removed from the repository.');
    
    //These files were previously not checked in. Since 2.0.0 we do not ignore them
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', '.gitignore')), 'The file ‘.gitignore’ should have been copied into the repository.');
	test.ok(grunt.file.exists(path.join('tmp/checkout/standard/trunk', 'deploy.sh')), 'The file ‘deploy.sh’ should have been copied into the repository.');
    
    //Make sure no additional files crept in:
    grunt.file.recurse('tmp/checkout/standard/trunk', function(abs, root, subdir, file) {
    	subdir = ( 'undefined' == typeof subdir ) ? '' : subdir;
        if ( grunt.file.isMatch( { dot: true }, ['**/.svn/**', '**.svn-base'], abs ) ) {
    		return;
    	}
    	test.ok(grunt.file.exists(path.join('test/fixtures/second/build', subdir, file)), 'The file ‘' + file + '’ has been copied into trunk but should not have been.');
    });
    grunt.file.recurse('tmp/checkout/standard/assets', function(abs, root, subdir, file) {
        if ( grunt.file.isMatch( { dot: true }, ['**/.svn/**', '**.svn-base'], abs ) ) {
    		return;
    	}
    	test.ok(grunt.file.exists(path.join('test/fixtures/second/assets', file)), 'The file ‘' + file + '’ has been copied into assets but should not have been.');
    });
    
    test.done();
  },

  /**
   * Check the asset directory has all the files it should have
   * and that files removed from the second build are have been removed
   */
  assets_files: function(test) {
    test.expect(3);
    test.ok(grunt.file.exists(path.join('tmp/checkout/standard/assets', 'cat.png')), 'The file ‘cat.png’ should have been copied into the repository.');
    test.ok(grunt.file.exists(path.join('tmp/checkout/standard/assets', 'wp.png')), 'The file ‘wp.png’ should have been copied into the repository.');
    test.ok(!grunt.file.exists(path.join('tmp/checkout/standard/assets', 'wp-orange.png')), 'The file ‘wp-orange.png’ should have been removed from the repository.');
    test.done();
  },

  /**
   * Check that all the commit messages are present and in order
   */  
  commit_message: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: "svn",
      args: ['log', 'file://' + path.resolve() + '/tmp/repo/standard']
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
      cmd: 'svn',
      args: ['list', 'file://' + path.resolve() + '/tmp/repo/standard/tags'],
    },function( error, result, code ){
      var expected = "1.3.2/\n1.4.0/";
      test.equal( result.stdout, expected, 'The deployment repository`s tags are not as expected' )
      test.done();
    });
  },
  
  first_tag: function(test) {
    test.expect(1);
    grunt.util.spawn({
      cmd: 'svn',
      args: ['list', '-R', 'file://' + path.resolve() + '/tmp/repo/standard/tags/1.3.2'],
    },function( error, result, code ){
      var expected = [
        "ReadMe.md",
        "readme.txt",
        "standard.php",
        "to-be-removed.php"
      ];
      test.equal( result.stdout, expected.join("\n"), 'The files in the 1.3.2 tag are not as expected' )
      test.done();
    });
  },
  
  second_tag: function(test) {
    test.expect(15);

    test.expect(1);
    grunt.util.spawn({
      cmd: 'svn',
      args: ['list', '-R', 'file://' + path.resolve() + '/tmp/repo/standard/tags/1.4.0'],
    },function( error, result, code ){
      var expected = [
        ".gitignore",
        "ReadMe.md",
        "deploy.sh",
        "folder/",
        "folder/file.php",
        "readme.txt",
        "standard.php",
        "this-file-is-added.php",
      ];
      test.equal( result.stdout, expected.join("\n"), 'The files in the 1.4.0 tag are not as expected' )
      test.done();
    });
  },
};
