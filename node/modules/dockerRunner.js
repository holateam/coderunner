var conf = require('./../config.json') || {supportedLangs: []};
var ArgEx = require('./exceptions/illegalarg').IllegalArgumentException;
var fs = require('fs');
var mkdirp = require('mkdirp');
var log = require('./logger');
var DockerExecutor = require('./dockerExecutor');
var cp = require('child_process');
var queue = require("function-queue")();


function DockerRunner () {

    this.response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };

    this.finalized = false;

}

DockerRunner.prototype.run = function (options, cb) {

    if (!options) {
        throw new ArgEx('you must pass options object as argument');
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
        throw new ArgEx('options.sessionId must be defined');
    }
    if (!this.opt.code) {
        throw new ArgEx('options.code must be defined');
    }
    if (!this.opt.language) {
        throw new ArgEx('options.language must be defined');
    }
    if (!this.opt.testCases) {
        throw new ArgEx('options.testCases must be defined');
    }

    log.info('Checking language support');

    if (conf.supportedLangs.indexOf(this.opt.language) == -1) {
        var message = 'language ' + this.opt.language + ' is unsupported, use one of those: ' + String(conf.supportedLangs);
        throw new ArgEx(message)
    }

    // preparing variables
    //noinspection JSUnresolvedVariable
    this.dockerSharedDir = conf.dockerSharedDir;
    this.sessionDir = this.dockerSharedDir + "/" + this.opt.sessionId;
    this.imageName = this.opt.language + "_img";

    this.dockerExecutor = new DockerExecutor(this.opt.sessionId, this.imageName);

    var _this = this;

    queue.push(_this.createSharedDirectory.bind(_this));
    queue.push(_this.putCodeIntoDirectory.bind(_this));
    queue.push(_this.compileCode.bind(_this));
    queue.push(_this.runTestCases.bind(_this));

    queue.push(function (cb) {
        _this.finalize();
        cb();
    });


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

        cp.exec ("chcon -Rt svirt_sandbox_file_t " + _this.sessionDir, function() {

            if (err) {
                _this.finalize( Error('Can not carefully resolve SElinux permission', err) );
            } else {
                log.info('SElinux permissions granted');
                callback.call(_this);
            }

        });

    });
};

DockerRunner.prototype.compileCode = function (callback) {
    var _this = this;
    var dockerExecutor = new DockerExecutor(_this.opt.sessionId, _this.imageName);
    dockerExecutor.startCompile(function (err, stdout, stderr) {

        log.info("returned from compile-docker: ", stdout || null, stderr || null, err || null);

        if (err) {
            _this.response.compilerErrors = stderr || '';
            _this.finalize( Error(err) );
        }

        if (stderr) {
            _this.response.compilerErrors = stderr;
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

        _this.mergeResponse(response);
        callback.call();

    });

};

DockerRunner.prototype.finalize = function (err) {

    if (!this.finalized) {

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

        this.finalized = true;
    }
};

DockerRunner.prototype.mergeResponse = function (response) {
    var _this = this;
    for (var property in response) {
        if (response.hasOwnProperty(property) && _this.response.hasOwnProperty(property)) {
            this.response[property] = response[property];
        }
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
