# grunt-wp-deploy

> Deploys a git Repo to the WordPress SVN repo

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-wp-deploy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-wp-deploy');
```

## The "wp_deploy" task

This task is for deploying a plug-in to the [WordPress repository](http://wordpress.org/plugins/) from a 'build directory'. 

### Before you start, you'll need...
 1. To have been [accepted](http://wordpress.org/plugins/about/) on to the WordPress repository
 2. **plugin-slug** - You can get this from your plug-in's repo url: *http://wordpress.org/plugins/{plugin-slug}*
 3. **readme.txt** - See [http://wordpress.org/plugins/about/#readme](http://wordpress.org/plugins/about/#readme) 
 4. **plugin-slug.php** - The 'main file' of the plug-in (containing the plugin header). Currently this must be named **{plugin-slug}.php** where {plugin-slug} should be replaced by your plug-in's slug. See (2).
 5. **build directory** - This a complete copy of the plug-in as you want it on the directory
 6. (Optional) **assets directory** - This directory should contain the plug-in's screenshots and other files you want in the 'assets' directory in the root of the plug-ins WordPress SVN repo. See [https://wordpress.org/plugins/about/faq/](https://wordpress.org/plugins/about/faq/) for details.

### Overview
In your project's Gruntfile, add a section named `wp_deploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
	wp_deploy: {
		deploy: { 
			options: {
				plugin_slug: 'your-plugin-slug',
				svn_user: 'your-wp-repo-username',	
				build_dir: 'build' //relative path to your build directory
				assets_dir: 'wp-assets' //relative path to your assets directory (optional).
			},
		}
	},
})
```

### Options

#### options.plugin_slug
Type: `String`
Default value: `false`

Your plug-in's slug as indicated by its repository url *http://wordpress.org/plugins/{plugin-slug}*

#### options.svn_user
Type: `String`
Default value: `false`

Your WordPress repository username. If not provided, you'll be prompted for this when the task runs.

#### options.build_dir
Type: `String`
Default value: `false`

The directory where the plug-in exists as you want it on the repo.

#### options.assets_dir
Type: `String`
Default value: `false`

The directory where the plug-in's assets (i.e. screenshots) exist. This gets copied into the 'assets' directory in the root of your WordPress SVN repo. Typically
this directory contains your plug-in's screenshots, which you want uploaded to the WordPress repo, but do not necessary want included in the plug-in distrubted 
to users. For more details see: [https://wordpress.org/plugins/about/faq/](https://wordpress.org/plugins/about/faq/).

#### options.svn_url
Type: `String`
Default value: `http://plugins.svn.wordpress.org/{plugin-slug}`

For flexibilty this plug-in can work with other repos. Simple provide the SVN url, using `{plugin-slug}` as placeholder indicating where the plug-in slug should be.

#### options.max_buffer
Type: `Integer`
Default value: `200*1024`

Sets the maximum buffer for the SVN checkout of the repo. 

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 1.0.3 - 5th September 2014
- Fixed bug with undefined max_buffer option. Thanks to @tamarazuk.

### 1.0.2 - 4th September 2014
- Fixes bug where files in sub directory are missed
- Fixes bug where assets/build directory are not given a trailing slash
- Adds max_buffer option for SVN checkout

### 1.0.1 - 17th August 2014
- Run assets after commiting to trunk/tag has complete. Fixes SVN E155037 error.

### 1.0.0 - 26th June 2014
- Rewrote task to use `grunt.file.copy` (skirts around issues on Windows)
- Fixed bugs (related to SVN) with commiting the assets directory

### 0.5.0
 - Added support for `assets_dir`

### 0.4.0
 - Add more verbose error messages.
 - Use `cp -a` instead of `cp -ar` (fixes #1,#2)

#### 0.3.0
 - Improved regex for version detection in `{plugin-slug}.php`

#### 0.2.0
 - Improved regex for version detection in `readme.txt` / `{plugin-slug}.php`
 - Abort (fail with warning) if versions do not match
 - Linted plug-in
 - Corrected abort message
 - Fixed readme

#### 0.1.0
Initial release

