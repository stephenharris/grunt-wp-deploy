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


#### options.svn_url
Type: `String`
Default value: `http://plugins.svn.wordpress.org/{plugin-slug}`

For flexibilty this plug-in can work with other repos. Simple provide the SVN url, using `{plugin-slug}` as placeholder indicating where the plug-in slug should be.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

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

