# Stylus Auto Compile

Stylus Auto Compile is an extension for Brackets, that adds possibility to auto compile Stylus files into CSS files on save.

### Installation

Stylus Auto Compile can be installed from the Brackets Extension Manager by searching "stylus autocompile", after instalation please restart Brackets.

### Manual Installation

0. Install [NodeJS](https://nodejs.org)
1. Find your extension folder: Choose Help > Show Extensions Folder (or open it manually)
2. Drill down to the user folder
3. Check out the extension from GitHub into the user folder
4. Run `npm i` in the root folder of the extension
5. Run `npm i` in the node folder of the extension

### Compile Options

Stylus auto compile extension has few options that can be set in the first line of the edited stylus file:

    // out: ../dist/app.css, compress: true, sourcemap: true

The following compile options are available:

* out: redirect the css output to a different file
* main: compile a different file instead of this one (ignores all other options)
* compress: compress the css output
* sourcemap: generate a source map
* prefix: adds prefix to css classes

