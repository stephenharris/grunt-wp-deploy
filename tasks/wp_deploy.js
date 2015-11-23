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
	var execSync = require('child_process').execSync;
	var process = require('process');
	var inquirer = require('inquirer');
	var path = require('path');
	var awk = process.platform === 'win32'? 'gawk' : 'awk';

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('wp_deploy', 'Deploys a git Repo to the WordPress SVN repo', function() {

		var done = this.async();
		var cmd;

		var options = this.options({
			svn_url: "http://plugins.svn.wordpress.org/{plugin-slug}",
			svn_user: false,
			plugin_main_file: false,
			plugin_slug: false,
			build_dir: false,
			assets_dir: false,
			tmp_dir: "/tmp/",
			max_buffer: 200*1024,
		});

		var pkg = grunt.file.readJSON('package.json');
		var questions = [];

		if( !options.plugin_slug ){
			grunt.fail.fatal( "Plug-in slug not provided" );
		}

		if( !options.build_dir ){
			grunt.fail.fatal( "Build directory not provided" );
		}

		if( !options.svn_user ){
			questions.push({
				type: "input",
				name: "svn_username",
				message: "What's your SVN username?"
			});
		}

		inquirer.prompt( questions, function( answers ) {

			//Set up slug, main file, readme file and paths.
			var slug = options.plugin_slug;
			var svnpath     = options.tmp_dir.replace(/\/?$/, '/') + slug;
			var build_dir   = options.build_dir.replace(/\/?$/, '/'); //trailing slash
			var readme_file = build_dir + "readme.txt";

			if ( options.plugin_main_file ) {
				var plugin_file = build_dir + options.plugin_main_file;
			} else {
				var plugin_file = build_dir + slug + ".php";
			}

			//SVN user/url
			var svnuser = options.svn_user || answers.svn_username;
			var svnurl = options.svn_url.replace( '{plugin-slug}', slug );

			//Try to find readme
			if ( !grunt.file.exists(readme_file) ) {
				grunt.fail.warn('readme.txt file not not found at ' + readme_file );
			}

			//Try to find plug-in file
			if ( !grunt.file.exists(plugin_file) ) {
				grunt.fail.warn( plugin_file+' file not not found.');
			}

			//Get versions:
			var readme = grunt.file.read(readme_file);
			var readmeVersion = readme.match( new RegExp("^Stable tag:\\s*(\\S+)","im") );
			var plugin = grunt.file.read(plugin_file);
			var pluginVersion = plugin.match( new RegExp("^[ \t\/*#@]*Version:\\s*(\\S+)$","im") );

			//Check versions
			if(  projectVersionCompare( pluginVersion[1],  readmeVersion[1] )  !== 0 ){
				grunt.log.warn( "Readme.txt version: " + readmeVersion[1] );
				grunt.log.warn( slug+".php version: " + pluginVersion[1] );
				grunt.fail.warn( 'Versions do not match:');
			}

			//Set some varaibles
			var new_version = pluginVersion[1];
			var trunkCommitMsg = "Committing " + new_version + " to trunk";
			var tagCommitMsg   = "Tagging " + new_version;
			var assetCommitMsg = "Committing assets for " + new_version;

			//Clean up temp dir
			cmd = execSync( 'rm -fr '+svnpath );

			//Check out SVN repo
			grunt.log.writeln( 'Checking out '+ svnurl+ '...' );
			cmd = exec( 'svn co '+svnurl+ ' ' + svnpath + ' --username="'+svnuser, { maxBuffer: options.max_buffer }, function (error, stdout, stderr) {

				if (error !== null) {
					grunt.fail.fatal( 'Checkout of "'+svnurl+'"unsuccessful: ' + error);
				}

				grunt.verbose.writeln( stdout );
				grunt.verbose.writeln( stderr );

				grunt.log.writeln( 'Check out complete.' + "\n" );

				if( grunt.file.exists(  svnpath+"/tags/"+new_version) ){
					grunt.fail.warn( 'Tag ' + new_version + ' already exists');
				}

				//Clearing trunk
				grunt.log.writeln( 'Clearing trunk.');
				execSync( 'rm -fr '+svnpath+"/trunk/*" );

				//grunt.log.writeln( 'Ignoring github specific files and deployment script.');
				execSync( 'svn propset svn:ignore "deploy.sh readme.md .git .gitignore" "'+svnpath+'/trunk/"' );

				//Copying build to temporary directory
				grunt.log.writeln( 'Copying build directory: ' + build_dir + ' to ' + svnpath+'/trunk/');
				copyDirectory( build_dir, svnpath+"/trunk/" );


				//If the assets folder is provided, copy this into assets
				if( options.assets_dir ){
					var assets_dir = options.assets_dir.replace(/\/?$/, '/'); //trailing slash
					grunt.log.writeln( 'Copying assets directory: ' + options.assets_dir + ' to ' + svnpath+'/assets/');
					copyDirectory( options.assets_dir, svnpath+"/assets/" );
				}

				//Lets ask for confirmation before commit stuff
				inquirer.prompt( [
					{
						type: "confirm",
						name: "are_you_sure",
						message: "\n" + "Are you sure you want to commit '" + new_version + "'?"
					}], function( answers ) {

						if( !answers.are_you_sure ){
							grunt.log.writeln( 'Aborting...' );
							return;
						}

						//(SVN) Add all new files that are not set to be ignored
						var cmd_add = "svn status | grep -v '^.[ \t]*\\..*' | grep '^?' | " + awk + " '{print $2}' | xargs svn add"; //Add new files
						var cmd_del = "svn status | grep -v '^.[ \t]*\\..*' | grep '^!' | " + awk + " '{print $2}' | xargs svn delete"; //Remove missing files
						
						grunt.log.writeln( execSync( cmd_add,{cwd: svnpath+'/trunk/'}) );

						cmd = exec(cmd_del,{cwd: svnpath+'/trunk/'}, function( a, b, c ){


							//Commit to trunk
							grunt.log.writeln( "\n" + trunkCommitMsg + "\n" );
							var cmd = exec( 'svn commit --force-interactive --username="'+svnuser+'" -m "'+trunkCommitMsg+'"',{cwd: svnpath+'/trunk'}, function(error, stdout, stderr) {

								if (error !== null) {
									grunt.fail.warn( 'Failed to commit to trunk: ' + error );
								}

								//Copy to tag
								grunt.log.writeln( 'Copying ' + new_version + ' to tag');
								var cmd = exec( "svn copy trunk/ tags/"+new_version, {cwd: svnpath}, function( error, stdout, stderr) {
									if (error !== null) {
										grunt.fail.warn( 'Failed to copy to tag: ' + error );
									}
									//Commit tag
									grunt.log.writeln( tagCommitMsg + "\n" );
									var cmd = exec( 'svn commit --force-interactive --username="'+svnuser+'" -m "'+tagCommitMsg+'"', {cwd: svnpath+'/tags/'+new_version}, function( error, stdout, stderr) {

										if (error !== null) {
											grunt.fail.warn( 'Failed to comit tag: ' + error );
										}

										//Commit assets
										if( options.assets_dir ){

											grunt.log.writeln( assetCommitMsg + "\n" );

											var cmd_add = "svn status | grep -v '^.[ \t]*\\..*' | grep '^?' | " + awk + " '{print $2}' | xargs svn add"; //Add new files
											var cmd_del = "svn status | grep -v '^.[ \t]*\\..*' | grep '^!' | " + awk + " '{print $2}' | xargs svn delete"; //Remove missing files
											var cmd_com = 'svn commit --force-interactive --username="'+svnuser+'" -m "'+assetCommitMsg+'"';
											
											execSync(cmd_add, {cwd: svnpath+'/assets/'});
											execSync(cmd_del, {cwd: svnpath+'/assets/'});

											var cmd = exec( cmd_com,{cwd: svnpath+'/assets'}, function(error, stdout, stderr) {
												if (error !== null) {
													grunt.fail.warn( 'Failed to commit to assets: ' + error );
												}
												done();
											} );
										}else{
											done();
										}
									});
								}); //Copy to  tag

							} );//Commit to trunk

						});//(SVN) Add files

				});//Confirmation

			}); //SVN Checkout

		});//Initial questions

	}); //Register

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

	var unixifyPath = function(filepath) {
		if (process.platform === 'win32') {
			return filepath.replace(/\\/g, '/');
		} else {
			return filepath;
		}
	};

	var copyDirectory = function( src_dir, dest_dir ){

		//Ensure directory has trailingslash
		if ( src_dir.substr(-1) != '/' ) {
			src_dir = src_dir + '/';
		}

		grunt.file.expand(  { 'expand': true, 'cwd' : src_dir }, '**/*' ).forEach( function( src ){
			var dest = unixifyPath(path.join( dest_dir, src));
			if ( grunt.file.isDir( src_dir + src ) ) {
				grunt.file.mkdir( dest);
			} else {
				grunt.file.copy( src_dir + src, dest );
			}
		});
	}
};
