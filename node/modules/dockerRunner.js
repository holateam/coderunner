var conf = require('./../config.json') || {supportedLangs: []};
var ArgEx = require('./exceptions/illegalarg').IllegalArgumentException;
var fs = require('fs');
var mkdirp = require('mkdirp');
//var log = require('./logger');
var DockerExecutor = require('./dockerExecutor');
var cp = require('child_process');
var TestCasesRunner = require('./TestCasesRunner');
var async=require('asyncawait/async');
var await=require('asyncawait/await');

function DockerRunner () {

    this.response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };
    //this.queue = require("function-queue")();

}

DockerRunner.prototype.run = function (options, cb) {
    this.log = options.log;
    this.finalized = false;

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

    this.log.info('Checking language support');

    if (conf.supportedLangs.indexOf(this.opt.language) == -1) {
        this.log.info('language is not supported');
        var message = 'language ' + this.opt.language + ' is unsupported, use one of those: ' + String(conf.supportedLangs);
        throw new ArgEx(message)
    } else {
        this.log.info('language ok');
    }

    // preparing variables
    //noinspection JSUnresolvedVariable
    this.dockerSharedDir = conf.dockerSharedDir;
    this.sessionDir = this.dockerSharedDir + "/" + this.opt.sessionId;
    this.imageName = this.opt.language + "_img";

    this.log.info('Create DockerExecutor object.');
    this.dockerExecutor = new DockerExecutor(this.opt.sessionId, this.imageName, this.log);

/*
    var _this = this;

    this.queue.push(_this.createSharedDirectory.bind(_this));
    this.queue.push(_this.putCodeIntoDirectory.bind(_this));
    this.queue.push(_this.compileCode.bind(_this));
    this.queue.push(_this.runTestCases.bind(_this));

    this.queue.push(function (cb) {
        _this.finalize();
        cb();
    });
*/
    var makeTestsAs = async(function (_this) {
        //console.log("making tests async with ", _this);
        var _res = await(createSharedDirectoryAw(_this));
        if (_res)
            _res = await(putCodeIntoDirectoryAw(_this));
        if (_res)
            _res = await(compileCodeAw(_this));
        if (_res)
            _res = await(runTestCasesAw(_this));
        await(deleteFolderRecursiveAw(_this));
        _this.log.info('Run DockerRunner callback function for ' + _this.opt.sessionId);
        _this.opt.callback(null, {sessionId: _this.opt.sessionId, response: _this.response});
    });
    makeTestsAs(this);

};


createSharedDirectoryAw = function (_this) {
  return function (callback) {
    _this.log.info('Try to create session directory.');
    mkdirp(_this.sessionDir + '/input', function (err) {
        var res=true;
        if (err) {
            res=false;
            _this.log.info('Error on session directory creating');
        } else {
            _this.log.info('Session directory created successful');
        }
    	callback(null,res);
    });
  }
};
putCodeIntoDirectoryAw = function (_this) {
  return function (callback) {
    _this.log.info('Try put code into directory.');
    fs.writeFile(_this.sessionDir + "/input/code", _this.opt.code, function (err) {
        var res=true;
        if (err) {
            res=false;
            _this.log.info('Error on User code has moved to file');
        } else {
            _this.log.info('User code has moved to file successful');
        }
        callback(null,res);
    });
  }
};
compileCodeAw = function (_this) {
  return function (callback) {
    _this.log.info('Try to compile.');
    _this.dockerExecutor.startCompile(function (err, stdout, stderr) {
        stderr = stderr.replace(conf.warningMsg, "").replace("\n", "");
        _this.log.info("...returned from DockerExecutor back to DockerRunner ");
	    var res=true;
        if (stderr) {
            if (stderr == conf.warningMsg){
                stderr="";
	    } else {
		    res=false;
	    }
            _this.response.compilerErrors = stderr;
        }
        callback(null,res);
    });
  }
};
runTestCasesAw = function (_this) {
  return function (callback) {
    _this.log.info('Try run testcases.');
    var testCasesRunner = new TestCasesRunner(_this.log);
    testCasesRunner.setTestCases(_this.opt.testCases);
      _this.log.info('Exec testCasesRunner.');
    testCasesRunner.run(_this.dockerExecutor, function (response) {
        _this.log.info('...return from testCasesRunner and merge response.');
        _this.mergeResponse(response);
        callback(null,true);
    });
  }
};
deleteFolderRecursiveAw = function (_this) {
  return function (callback) {
    _this.log.info('Deleting tmp folder '+ _this.sessionDir);
    cp.exec ("rm -rf " + _this.sessionDir, function(err) {
        if (err)
            _this.log.info('err on del',err);
        callback(null,true);
    });
  }
};



DockerRunner.prototype.putCodeIntoDirectory = function (callback) {

    log.info('Try put code into directory.');

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

    log.info('Try to create session directory.');

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

    log.info('Try to compile.');

    var _this = this;

    this.dockerExecutor.startCompile(function (err, stdout, stderr) {

        stderr = stderr.replace(conf.warningMsg, "").replace("\n", "");

        log.info("...returned from DockerExecutor back to DockerRunner ");

        if (stderr) {
            if (stderr == conf.warningMsg)
                stderr="";

            _this.response.compilerErrors = stderr;
        }

        callback.call(_this);
    });
};

DockerRunner.prototype.runTestCases = function (callback) {

    log.info('Try run testcases.');

    if (this.response.compilerErrors && this.response.compilerErrors.length > 0){
        log.info('Compiler error - exit from testcase block.');
        callback();
        return;
    }

    var TestCasesRunner = require('./TestCasesRunner');
    var testCasesRunner = new TestCasesRunner();
    testCasesRunner.setTestCases(this.opt.testCases);

    var _this = this;

    log.info('Exec testCasesRunner.');

    testCasesRunner.run(this.dockerExecutor, function (response) {

        log.info('...return from testCasesRunner and merge response.');
        _this.mergeResponse(response);
        callback.call();

    });

};

DockerRunner.prototype.finalize = function (err) {

    log.info('finalizing DockerRunner.');

    if (!this.finalized) {

        // logging errors
        if (err) {
            log.error('Finalizing with the following Error: ', err);
        }

        // delete temporary folders
        log.info('Remove tmp folders. '+this.sessionDir);
        this.deleteFolderRecursive(this.sessionDir);

        // call callback function
        if (this.opt.callback) {
            log.info('Run DockerRunner callback function for ' + this.opt.sessionId);
            this.opt.callback(err, {sessionId: this.opt.sessionId, response: this.response});
        } else {
            log.error('No callback for task');
        }

        this.finalized = true;
    } else {
        log.info('...already finalized');
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
