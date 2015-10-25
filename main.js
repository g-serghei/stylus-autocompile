/*jslint indent: 4, nomen: true */
/*global define, brackets, $ */

/**
 * Provides phplint results via the core linting extension point
 */

define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        DocumentManager = brackets.getModule('document/DocumentManager'),
        CodeInspection = brackets.getModule('language/CodeInspection'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        NodeConnection = brackets.getModule('utils/NodeConnection'),
        EditorManager = brackets.getModule('editor/EditorManager'),
        codeInspectionErrors = [];
    
    
    function compile(compiler, file) {
        var tasks = [];
        tasks.push(compiler.compile(file));
        return $.when.apply($, tasks);
    }
    
    // load a named node module
    function connectToNodeModule(moduleName) {
        var connection = new NodeConnection();
        return connection.connect(true).pipe(function () {
            var path = ExtensionUtils.getModulePath(module, 'node/' + moduleName);
            return connection.loadDomains([path], true);
        }).pipe(function () {
            return connection.domains[moduleName];
        });
    }
    
    function convertError(error) {
        if (typeof error === 'string') {
            return { pos: {}, message: error };
        }
        
        if (error.message) {
            var message = error.message.split('|'),
                pos = message[0].split(':');
            return { pos: {line: pos[1] - 1, ch: pos[2]}, message: message[message.length - 1] };
        } else {
            return { pos: {line: error.lineno - 1, ch: error.column}, message: 'Error in line: ' + error.lineno };
        }
    }
    
    
    function compileStylus(documentPath) {
        var deferred = new $.Deferred(),
            connection = connectToNodeModule('StylusCompiler');

        $.when(connection).then(function (compiler, options) {
            compile(compiler, documentPath).then(function () {
                codeInspectionErrors = [];
                deferred.resolve();
                CodeInspection.requestRun();
            }, function (error) {
                codeInspectionErrors = [convertError(error)];
                CodeInspection.requestRun();
            });
        }, function (error) {
            codeInspectionErrors = [error];
            CodeInspection.requestRun();
        });
        
        return deferred.promise();
    }
    
    
    CodeInspection.register('stylus', {
        name: 'Stylus Auto Compile',
        scanFile: function (text, fullPath) {
            return {
                errors: codeInspectionErrors
            };
        }
    });
    
    
    AppInit.appReady(function () {
        $(DocumentManager).on('documentSaved', function (event, document) {
            if (document.getLanguage().getId() === 'stylus') {
                compileStylus(document.file.fullPath);
            }
        });
    });

});