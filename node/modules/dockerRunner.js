var conf = require('./../config.json') || {supportedLangs: []};
var ArgEx = require('./exceptions/illegalarg').IllegalArgumentException;
var fs = require('fs');
var mkdirp = require('mkdirp');
var log = require('./logger');
var DockerExecutor = require('./dockerExecutor');
var queue = require("function-queue")();

function DockerRunner () {

    this.response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };

}

DockerRunner.prototype.run = function (options, cb) {

    if (!options) {
        this.finalize(new ArgEx('you must pass options object as argument'));
    }

    this.opt = {
        sessionId: options.sessionId || null,
        code: options.code || null,
        language: options.language || null,
        testCases: options.testCases || null,
        callback: cb || null
    };

    // validate parameters
    if (!this.opt.sessionId) {
        this.finalize(new ArgEx('options.sessionId must be defined'));
        return;
    }
    if (!this.opt.code) {
        this.finalize(new ArgEx('options.code must be defined'));
        return;
    }
    if (!this.opt.language) {
        this.finalize(new ArgEx('options.language must be defined'));
        return;
    }
    if (!this.opt.testCases) {
        this.finalize(new ArgEx('options.testCases must be defined'));
        return;
    }

    log.info('Checking language support');

    if (conf.supportedLangs.indexOf(this.opt.language)) {
        var message = 'language ' + this.opt.language + ' is unsupported, use one of those: ' + String(conf.supportedLangs);
        this.finalize(new ArgEx(message));
        return;
    }

    // preparing variables
    //noinspection JSUnresolvedVariable
    this.dockerSharedDir = conf.dockerSharedDir;
    this.sessionDir = this.dockerSharedDir + "/" + this.opt.sessionId;
    this.imageName = this.opt.language + "_img";

    this.dockerExecutor = new DockerExecutor(this.opt.sessionId, this.imageName);

    var _this = this;


    try {

        queue.push(this.createSharedDirectory.bind(this));
        queue.push(this.putCodeIntoDirectory.bind(this));
        queue.push(this.compileCode.bind(this));
        queue.push(this.runTestCases.bind(this));

        queue.push(function (cb) {
            _this.finalize();
            cb();
        });

    } catch (e) {
        log.error(e);
        this.finalize(e);
    }

};

DockerRunner.prototype.putCodeIntoDirectory = function (callback) {
    var _this = this;
    fs.writeFile(_this.sessionDir + "/input/code", _this.opt.code, function (err) {
        if (err) {
            throw Error('Cannot write code to docker shared file', err);
        }

        log.info('User code has moved to file successful');

        callback.call(_this);
    });
};

DockerRunner.prototype.createSharedDirectory = function (callback) {
    var _this = this;
    mkdirp(_this.sessionDir + '/input', function (err) {

        if (err) {
            throw Error('Cannot create session directory', err);
        }

        log.info('Session directory created successful');

        callback.call(_this);
    });
};

DockerRunner.prototype.compileCode = function (callback) {
    var _this = this;
    _this.dockerExecutor.startCompile(function (err, stdout, stderr) {

        log.info("returned from compile-docker: ", stdout || null, stderr || null, err || null);

        if (err || (stderr && (stderr != "WARNING: Your kernel does not support swap limit capabilities, memory limited without swap.\n"))) {
            _this.response.compilerErrors = stderr || '';
            throw Error(err || stderr);
        }

        callback.call(_this);
    });
};

DockerRunner.prototype.runTestCases = function (callback) {

    var TestCasesRunner = require('./TestCasesRunner');
    var testCasesRunner = new TestCasesRunner();
    testCasesRunner.setTestCases(this.opt.testCases);

    var _this = this;

    testCasesRunner.run(this.dockerExecutor, function (response) {
        //if(err) {
        //    throw Error(err);
        //}

        _this.response = response;
        callback.call();

    });

};

DockerRunner.prototype.finalize = function (err) {
    // logging errors
    if (err) {
        log.error('Finalizing with the following Error: ', err);
    }

    // delete temporary folders
    this.deleteFolderRecursive(this.sessionDir);

    // call callback function
    if (this.opt.callback) {
        this.opt.callback(err, {sessionId: this.opt.sessionId, response: this.response});
    } else {
        log.error('No callback for task');
    }

};

DockerRunner.prototype.deleteFolderRecursive = function (path) {
    var _this = this;
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                _this.deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

module.exports = DockerRunner;
