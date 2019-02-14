/*
 * grunt-wp-deploy
 * https://github.com/stephenharris/wp-deploy
 *
 * Copyright (c) 2013 Stephen Harris
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	var exec = require('child_process').exec;
	var inquirer = require('inquirer');
	var async = require('async');
	var path = require('path');
	var awk = process.platform === 'win32'? 'gawk' : 'awk';
	var no_run_if_empty = process.platform !== 'darwin' ? '--no-run-if-empty ' : '';

	var clearTrunk = function ( ctxt, callback ) {
		grunt.log.writeln( 'Clearing trunk.');
		exec( 'rm -fr '+ctxt.svnpath+"/trunk/*", function(){
			callback( null, ctxt );
		});
	};
	
	var checkOut = function(dir) {
		return function ( ctxt, callback ) {
			grunt.log.writeln( 'Checking out ' + ctxt.svnurl + dir + '/...' );
			exec( 'svn co ' + ctxt.force_interactive + ' ' + ctxt.svnurl + dir + '/ ' + ctxt.svnpath + '/' + dir + '/ ', { maxBuffer: ctxt.max_buffer }, function (error, stdout, stderr) {
				if (error !== null) {
					grunt.fail.fatal( 'Checkout of "' + ctxt.svnurl + dir + '/" unsuccessful: ' + error);
				}
	
				grunt.log.writeln( 'Check out complete.' + "\n" );
	
				callback( null, ctxt );
			});
		};
	} ;

	var clearAssets = function ( ctxt, callback ) {
		grunt.log.writeln( 'Clearing assets.');
		exec( 'rm -fr '+ctxt.svnpath+"/assets/*", function(){
			callback( null, ctxt );
		});
	};

	var unixifyPath = function(filepath) {
		if (process.platform === 'win32') {
			return filepath.replace(/\\/g, '/');
		} else {
			return filepath;
		}
	};

	var copyDirectory = function( src_dir, dest_dir, callback ){

		//Ensure directory has trailingslash
		if ( src_dir.substr(-1) !== '/' ) {
			src_dir = src_dir + '/';
		}

		grunt.file.expand(  { 'expand': true, 'cwd' : src_dir, dot: true }, '**/*' ).forEach( function( src ){
			var dest = unixifyPath(path.join( dest_dir, src));
			if ( grunt.file.isDir( src_dir + src ) ) {
				grunt.file.mkdir( dest);
			} else {
				grunt.file.copy( src_dir + src, dest );
			}
		});

		callback();
	};

	var copyBuild = function ( ctxt, callback ) {
		grunt.log.writeln( 'Copying build directory: ' + ctxt.build_dir + ' to ' + ctxt.svnpath+'/trunk/');
		copyDirectory( ctxt.build_dir, ctxt.svnpath+"/trunk/", function( ){
			callback( null, ctxt );
		} );
	};

	var copyAssets = function ( ctxt, callback ) {
		var assets_dir = ctxt.assets_dir.replace(/\/?$/, '/'); //trailing slash
		grunt.log.writeln( 'Copying assets directory: ' + assets_dir + ' to ' + ctxt.svnpath+'/assets/');
		copyDirectory( assets_dir, ctxt.svnpath+"/assets/", function( ){
			callback( null, ctxt );
		} );
	};

	var confirmation = function( ctxt, callback ) {
		inquirer.prompt([
			{
				type: "confirm",
				name: "are_you_sure",
				message: "\n" + "Are you sure you want to commit '" + ctxt.new_version + "'?"
			}])
			.then(function( answers ) {
				if( !answers.are_you_sure ){
					grunt.log.writeln( 'Aborting...' );
					return;
				}
				callback( null, ctxt );
			});
	};

	var addFiles = function( ctxt, callback ) {
		var cmd = "svn status |" + awk + " '/^[?]/{print $2}' | xargs " + no_run_if_empty + "svn add;";
		cmd += "svn status | " + awk + " '/^[!]/{print $2}' | xargs " + no_run_if_empty + "svn delete;";
		exec(cmd,{cwd: ctxt.svnpath+"/trunk"}, function( a, b, c ){
			callback( null, ctxt );
		});
	};

	var commitToTrunk = function( ctxt, callback ) {
		var trunkCommitMsg = "Committing " + ctxt.new_version + " to trunk";
		grunt.log.writeln( "\n" + trunkCommitMsg + "\n" );
		var cmd = 'svn commit ' + ctxt.force_interactive + ' --username="'+ctxt.svnuser+'" -m "'+trunkCommitMsg+'"';
		exec( cmd, {cwd:ctxt.svnpath+'/trunk'}, function(error, stdout, stderr) {
			if (error !== null) {
				grunt.fail.warn( 'Failed to commit to trunk: ' + error );
			}
			callback( null, ctxt );
		});
	};

	var checkTag = function( ctxt, callback ) {
		var tagCheckMsg   = "Checking tag " + ctxt.new_version;
		grunt.log.writeln( tagCheckMsg + "\n" );
		var cmd = 'svn co ' + ctxt.svnurl + 'tags/' + ctxt.new_version + '/ ' + ctxt.svnpath + '/' + ctxt.new_version + '/ --username="'+ctxt.svnuser+'"';
		exec( cmd, function( error, stdout, stderr) {
			if (error === null) {
				grunt.fail.fatal( 'Tag already exists' );
			}
			callback( null, ctxt );
		});
	};

	var commitTag = function( ctxt, callback ) {
		var tagCommitMsg   = "Tagging " + ctxt.new_version;
		grunt.log.writeln( tagCommitMsg + "\n" );
		var cmd = 'svn copy ' + ctxt.svnurl + 'trunk/ ' + ctxt.svnurl + 'tags/' + ctxt.new_version + '/ ' + ctxt.force_interactive + ' --username="'+ctxt.svnuser+'" -m "'+tagCommitMsg+'"';
		exec( cmd , { cwd: ctxt.svnpath }, function( error, stdout, stderr) {
			if (error !== null) {
				grunt.fail.warn( 'Failed to commit tag: ' + error );
			}
			callback( null, ctxt );
		});
	};

	var addAssets = function( ctxt, callback ) {
		var cmd = "svn status |" + awk + " '/^[?]/{print $2}' | xargs " + no_run_if_empty + "svn add;";
		cmd += "svn status | " + awk + " '/^[!]/{print $2}' | xargs " + no_run_if_empty + "svn delete;";
		exec( cmd,{ cwd: ctxt.svnpath+"/assets" }, function(error, stdout, stderr) {
			if (error !== null) {
				grunt.log.writeln( cmd );
				grunt.fail.warn( 'Failed to add assets: ' + error );
			}
			callback( null, ctxt );
		} );
	};

	var commitAssets = function( ctxt, callback ) {
		var assetCommitMsg = "Committing assets for " + ctxt.new_version;
		grunt.log.writeln( assetCommitMsg + "\n" );

		var cmd = 'svn commit ' + ctxt.force_interactive + ' --username="'+ctxt.svnuser+'" -m "'+assetCommitMsg+'"';

		exec( cmd,{ cwd: ctxt.svnpath+"/assets" }, function(error, stdout, stderr) {
			if (error !== null) {
				grunt.fail.warn( 'Failed to commit to assets: ' + error );
			}
			callback( null, ctxt );
		} );
	};

	//Compares version numbers
	var projectVersionCompare = function(left, right) {
		if (typeof left + typeof right !== 'stringstring'){
			return false;
		}

		var a = left.split('.'),   b = right.split('.'),   i = 0, len = Math.max(a.length, b.length);
		for (; i < len; i++) {
			if ((a[i] && !b[i] && parseInt(a[i], 10) > 0) || (parseInt(a[i], 10) > parseInt(b[i], 10))) {
				return 1;
			} else if ((b[i] && !a[i] && parseInt(b[i], 10) > 0) || (parseInt(a[i], 10) < parseInt(b[i], 10))) {
				return -1;
			}
		}

		return 0;
	};


	var detectDestType = function(dest) {
		if (grunt.util._.endsWith(dest, '/')) {
			return 'directory';
		} else {
			return 'file';
		}
	};


	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('wp_deploy', 'Deploys a git Repo to the WordPress SVN repo', function() {

		var done = this.async();

		var options = this.options({
			svn_url: "https://plugins.svn.wordpress.org/{plugin-slug}/",
			svn_user: false,
			plugin_main_file: false,
			plugin_slug: false,
			build_dir: false,
			assets_dir: false,
			tmp_dir: "/tmp/",
			max_buffer: 200*1024,
			skip_confirmation: false,
			force_interactive: true,
			deploy_trunk: true,
			deploy_tag: true
		});

		var pkg = grunt.file.readJSON('package.json');
		options.deploy_tag = options.deploy_tag && options.deploy_trunk;

		if( !options.plugin_slug ){
			grunt.fail.fatal( "Plug-in slug not provided" );
		}

		if( !options.build_dir ){
			grunt.fail.fatal( "Build directory not provided" );
		}

		var questions = [];
		questions.push({
			type: "input",
			name: "svn_username",
			message: "What's your SVN username?",
			when: !options.svn_user
		});

		inquirer.prompt( questions).then(function(answers){

			//Set up slug, main file, readme file and paths.
			var slug = options.plugin_slug, plugin_file;

			var svnpath     = options.tmp_dir.replace(/\/?$/, '/') + slug;
			var build_dir   = options.build_dir.replace(/\/?$/, '/'); //trailing slash
			var readme_file = build_dir + "readme.txt";

			if ( options.plugin_main_file ) {
				plugin_file = build_dir + options.plugin_main_file;
			} else {
				plugin_file = build_dir + slug + ".php";
			}

			//SVN user/url
			var svnuser = options.svn_user || answers.svn_username;
			var svnurl = options.svn_url
				.replace( '{plugin-slug}', slug )
				.replace(/\/?$/, '/'); //ensure trailing slash

			//Try to find readme
			var exts = ['txt','md'];
			while( !grunt.file.exists(readme_file) && exts.length > 0 ) {
				var readmes = ['readme', 'README', 'ReadMe' ];
				var ext = exts.shift();
				while( !grunt.file.exists(readme_file) && readmes.length > 0 ) {
					var filename = readmes.shift();
					readme_file = build_dir + filename + '.' + ext;
					console.log( readme_file );
				}
			}
			if ( !grunt.file.exists(readme_file) ) {
				grunt.fail.warn('readme.txt file not not found at ' + readme_file );
			}

			//Try to find plug-in file
			if ( !grunt.file.exists(plugin_file) ) {
				grunt.fail.warn( plugin_file+' file not not found.');
			}

			//Get versions:
			var readme = grunt.file.read(readme_file);
			var readmeVersion = readme.match( new RegExp("^[ \t*]*Stable tag:\\s*(\\S+)","im") );
			var plugin = grunt.file.read(plugin_file);
			var pluginVersion = plugin.match( new RegExp("^[ \t\/*#@]*Version:\\s*(\\S+)$","im") );

			//Check versions
			if( null !== readmeVersion && options.deploy_tag && projectVersionCompare( pluginVersion[1],  readmeVersion[1] )  !== 0 ){
				grunt.log.warn( "Readme.txt version: " + readmeVersion[1] );
				grunt.log.warn( plugin_file+" version: " + pluginVersion[1] );
				grunt.fail.warn( 'Versions do not match:');
			}

			var ctxt = {
				new_version: pluginVersion[1],
				svnurl: svnurl,
				svnuser: svnuser,
				svnpath: svnpath,
				max_buffer: options.max_buffer,
				build_dir: build_dir,
				assets_dir: options.assets_dir,
				force_interactive: options.force_interactive ? '--force-interactive' : '',
				deploy_tag: options.deploy_tag
			};

			var steps = [
				function( callback ) {
					callback( null, ctxt );
				},
				options.deploy_tag ? checkTag : null,
				checkOut('trunk'),
				options.deploy_trunk ? clearTrunk : null,
				options.deploy_trunk ? copyBuild : null,
				options.assets_dir ? checkOut('assets') : null,
				options.assets_dir ? clearAssets : null,
				options.assets_dir ? copyAssets : null,
				options.skip_confirmation ? null : confirmation,
				options.deploy_trunk ? addFiles : null,
				options.deploy_trunk ? commitToTrunk : null,
				options.deploy_tag ? commitTag : null,
				options.assets_dir ? addAssets : null,
				options.assets_dir ? commitAssets : null
			].filter(function(val) { return val !== null; });

			async.waterfall( steps, function (err, result){
				done();
			});

		});//Initial questions

	}); //Register
};
