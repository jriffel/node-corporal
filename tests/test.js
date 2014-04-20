
var _ = require('underscore');
var assert = require('assert');
var path = require('path');

var CorporalTestRunner = require('./util/runner');

var _currentRunners = [];


/*!
 * Kill all runners that were created in the previous test
 */
afterEach(function(callback) {
    _.each(_currentRunners, function(runner) {
        runner.close();
    });
    _currentRunners = [];
    return callback();
});

describe('Command Loading', function() {

    it('loads commands from a directory', function(callback) {
        var runner = _createRunner(_commandDir('loads-commands-from-a-directory'));
        runner.start(function() {
            runner.exec('help', function(data) {
                assert.notEqual(data.indexOf('help    :  Show a dialog of all available commands.'), -1);
                assert.notEqual(data.indexOf('quit    :  Quit the interactive shell.'), -1);
                assert.notEqual(data.indexOf('command1:  command1.'), -1);
                assert.notEqual(data.indexOf('command2:  command2.'), -1);
                return callback();
            });
        });
    });

    it('fails when a command without a description is encountered', function(callback) {
        var runner = _createRunner(_commandDir('fails-when-a-command-without-a-description-is-encountered'));
        runner.start(function() {});

        // Keep track of all stderr output from the process. We are listening for an error
        var stderr = '';
        runner.on('stderr', function(data) {
            stderr += data;
        });

        runner.on('close', function(code) {
            assert.strictEqual(code, 8);
            assert.notEqual(stderr.indexOf('Command "no-description" must have a description string'), -1);
            return callback();
        });
    });

    it('fails when a command without an invoke method is encountered', function(callback) {
        var runner = _createRunner(_commandDir('fails-when-a-command-without-an-invoke-method-is-encountered'));
        runner.start(function() {});

        // Keep track of all stderr output from the process. We are listening for an error
        var stderr = '';
        runner.on('stderr', function(data) {
            stderr += data;
        });

        runner.on('close', function(code) {
            assert.strictEqual(code, 8);
            assert.notEqual(stderr.indexOf('Command "no-invoke-method" must have an invoke function'), -1);
            return callback();
        });
    });
});

describe('Built-In Commands', function() {

    describe('non-existing', function() {

        it('provides an error and lists commands when a non-existing command is entered', function(callback) {
            var runner = _createRunner();
            runner.start(function() {
                runner.exec('bleh', function(data) {
                    assert.notEqual(data.indexOf('Invalid command:'), -1);
                    assert.notEqual(data.indexOf('bleh'), -1);
                    return callback();
                });
            });
        });
    });

    describe('help', function() {

        it('lists the help and quit command when run without arguments', function(callback) {
            var runner = _createRunner();
            runner.start(function() {
                runner.exec('help', function(data) {
                    assert.notEqual(data.indexOf('help:  Show a dialog of all available commands.'), -1);
                    assert.notEqual(data.indexOf('quit:  Quit the interactive shell.'), -1);
                    return callback();
                });
            });
        });

        it('lists the help and usage of the quit command', function(callback) {
            var runner = _createRunner();
            runner.start(function() {
                runner.exec('help quit', function(data) {
                    assert.notEqual(data.indexOf('Quit the interactive shell.'), -1);
                    return callback();
                });
            });
        });

        it('lists the help and usage of the help command', function(callback) {
            var runner = _createRunner();
            runner.start(function() {
                runner.exec('help help', function(data) {
                    assert.notEqual(data.indexOf('Show a dialog of all available commands.'), -1);
                    assert.notEqual(data.indexOf('Usage: help [<command>]'), -1);
                    return callback();
                });
            });
        });
    });

    describe('quit', function() {

        it('quits the process', function(callback) {
            var runner = _createRunner();
            runner.start(function() {
                runner.exec('quit');
                runner.once('close', function(code, signal) {
                    assert.strictEqual(code, 0);
                    return callback();
                });
            });
        });
    });
});

/*!
 * Creates a runner and keeps track of it to be closed after the
 * test.
 */
function _createRunner(commands, ps1, ps2) {
    var runner = new CorporalTestRunner(commands, ps1, ps2);
    _currentRunners.push(runner);
    return runner;
}

/*!
 * Convenience method to get a comamnds directory by bottom-level
 * folder name
 */
function _commandDir(dir) {
    return path.join(__dirname, 'commands', dir);
}
