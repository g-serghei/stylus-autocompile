/*jshint node: true, evil: true */
/*global require, exports */
'use strict';

var path = require('path');
var fs = require('fs');
var extend = require('util')._extend;
var stylus = require('stylus');
var mkpath = require('mkpath');

function readOptions(content) {
    var firstLine = content.substr(0, content.indexOf('\n')),
        match = /^\s*\/\/\s*(.+)/.exec(firstLine),
        options = {};

    if (!match) {
        return options;
    }

    match[1].split(',').forEach(function (item) {
        var key, value, i = item.indexOf(':');
    
        if (i < 0) {
            return;
        }
        
        key = item.substr(0, i).trim();
        value = item.substr(i + 1).trim();
        if (value.match(/^(true|false|undefined|null|[0-9]+)$/)) {
            value = eval(value);
        }
        options[key] = value;
    });
    return options;
}

// makes a file in a path where directories may or may not have existed before
function mkfile(filepath, content, callback) {
    mkpath(path.dirname(filepath), function (err) {
        if (err) {
            return callback ? callback(err) : undefined;
        }
        fs.writeFile(filepath, content, callback);
    });
}

// compile the given less file
function compile(stylusFile, callback) {
    fs.readFile(stylusFile, 'utf8', function (err, buffer) {
        if (err) {
            return callback(err);
        }

        var content = buffer.toString(),
            stylusPath = path.dirname(stylusFile),
            cssFilename,
            cssFile,
            defaults = {
                compress: false,
                sourcemap: false,
                prefix: '',
                paths: [stylusPath]
            },
            options = extend(defaults, readOptions(content)),
            style = stylus(content, options);

        // main is set: compile the referenced file instead
        if (options.main) {
            stylusFile = path.resolve(stylusPath, options.main);
            return compile(stylusFile, callback);
        }

        // out is null or false: do not compile
        if (options.out === null || options.out === false) {
            return callback();
        }

        // out is set: output to the given file name
        if (options.out) {
            cssFilename = options.out;
            if (path.extname(cssFilename) === '') {
                cssFilename += '.css';
            }
            delete options.out;
        } else {
            cssFilename = path.basename(stylusFile);
            cssFilename = cssFilename.substr(0, cssFilename.length - path.extname(cssFilename).length) + '.css';
        }
        
        cssFile = path.resolve(stylusPath, cssFilename);

        
        style.render(function (err, css) {
            if (err) {
                return callback(err);
            }
            
            mkfile(cssFile, css, function (err) {
                if (err) {
                    return callback(err);
                }
            });
            
            // write sourcemap
            if (options.sourcemap) {
                mkfile(cssFile + '.map', JSON.stringify(style.sourcemap), function (err) {
                    if (err) {
                        return callback(err);
                    }
                });
            }
            
            callback();
        });
    });
}


// set up service for brackets
function init(DomainManager) {
    if (!DomainManager.hasDomain('StylusCompiler')) {
        DomainManager.registerDomain('StylusCompiler', { major: 1, minor: 0 });
    }
    DomainManager.registerCommand(
        'StylusCompiler', // domain name
        'compile', // command name
        compile, // command handler function
        true, // this command is asynchronous
        'Compiles a stylus file',
        [{
            name: 'stylusFile',
            type: 'String',
            description: 'stylus filename'
        }, {
            name: 'callback',
            type: 'Function',
            description: 'callback function'
        }],
        null
    );
}

exports.init = init;