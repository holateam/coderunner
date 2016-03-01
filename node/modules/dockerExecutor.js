var cp = require('child_process');
//var log = require('./logger');
var async=require('asyncawait/async');
var await=require('asyncawait/await');

var cpOptions = {
    encoding: 'utf8',
    //timeout: parseInt(conf.userQuotes.taskLifetime) * 1000,
    killSignal: 'SIGKILL'
};

var config = require('./../config.json') || {supportedLangs: []};

function DockerExecutor (sessionId, imageName, logger) {
    this.log = logger;
    if (!sessionId) {
        throw Error('DockerExecutor:constructor wrong param sessionId');
    }

    if (!imageName) {
        throw Error('DockerExecutor:constructor wrong param imageName');
    }

    this.log.info('DockerExecutor init with the following params: ', sessionId, imageName);

    this.sessionId = sessionId;
    this.imageName = imageName;
    //noinspection JSUnresolvedVariable
    this.timeout = config.userQuotes.taskLifetime * 1000;
}

DockerExecutor.prototype.runTestCase = function (testCase, callback) {

    this.log.info('DockerExecutor run testcase', testCase);

    if (!testCase) {
        throw Error('DockerExecutor wrong param testCase >> ', testCase);
    }

    var execCommand = this.templates().runTestCase
        .replace('{sessionId}', this.getSessionId())
        .replace('{dockerMaxMemory}', this.getDockerMaxMemory())
        .replace('{dockerCpuSet}', this.getDockerCpuInfo())
        .replace('{sharedDir}', this.getDockerSharedDir())
        .replace('{imageName}', this.getImageName())
        .replace('{testCase}', testCase.replace(/\n/g, "\\n"));

    this.run(execCommand, callback);

};

DockerExecutor.prototype.kill = function () {
    this.log.info('DockerExecutor do kill');
    var executeCommand = this.templates().kill
        .replace('{sessionId}', this.getSessionId());

    this.run(executeCommand, null);
};

DockerExecutor.prototype.rm = function (cb) {
    this.log.info('DockerExecutor do rm container '+this.getSessionId());
    var executeCommand = this.templates().rm
        .replace('{sessionId}', this.getSessionId());

    this.run(executeCommand, null);
    cb();
};

DockerExecutor.prototype.startCompile = function (callback) {

    this.log.info('DockerExecutor start to compile the code');

    var execCommand = this.templates().compile
        .replace('{sessionId}', this.getSessionId())
        .replace('{dockerMaxMemory}', this.getDockerMaxMemory())
        .replace('{dockerCpuSet}', this.getDockerCpuInfo())
        .replace('{sharedDir}', this.getDockerSharedDir())
        .replace('{imageName}', this.getImageName());

    this.run(execCommand, callback);

};

DockerExecutor.prototype.getSessionId = function () {
    return this.sessionId;
};
DockerExecutor.prototype.getDockerMaxMemory = function () {
    //noinspection JSUnresolvedVariable
    return config.userQuotes.dockerMaxMemory;
};
DockerExecutor.prototype.getDockerCpuInfo = function () {
    var cpuInfo = '0';
    //noinspection JSUnresolvedVariable
    for (var i = 1; i < parseInt(config.userQuotes.dockerMaxCores); i++) {
        cpuInfo += ', ' + i;
    }
    return cpuInfo;
};
DockerExecutor.prototype.getDockerSharedDir = function () {
    //noinspection JSUnresolvedVariable
    return config.dockerSharedDir + '/' + this.sessionId;
};
DockerExecutor.prototype.getImageName = function () {
    return this.imageName;
};

DockerExecutor.prototype.templates = function () {
    return {
        /** @ToDo move /opt/data to config */
        'compile': 'docker run --name={sessionId} -m {dockerMaxMemory}m --net none -v {sharedDir}:/opt/data {imageName} startcompile',
        'runTestCase': 'echo \"{testCase}\" | docker run --name={sessionId} -i -m {dockerMaxMemory}m --net none -v {sharedDir}:/opt/data --log-driver=json-file --log-opt max-size=1k {imageName} start',
        'kill': 'docker kill {sessionId}',
        'rm': 'docker rm {sessionId}'
    }
};

DockerExecutor.prototype.run = function (command, callback) {

    var _this = this;

    this.log.info('DockerExecutor run command >> ', command);

    var called = false;

    var onTimeout = function () {
        _this.log.info('...DockerExecutor timeout called after ', _this.timeout, 'ms');
        if (called) {
            _this.log("...already closed");
            return;
        }
        called = true;
        if (callback) {
            callback.apply(this, ['Time is out of running command >> ' + command, '', '']);
            _this.kill();
        }
    };

    var timeoutID = setTimeout(onTimeout, _this.timeout);

    var prepareCallback = function () {
        _this.log.info('...DockerExecutor prepareCallback called');
        if (called) {
            _this.log.info('...already called (?by timeout), so return');
            return;
        }

        called = true;
        clearTimeout(timeoutID);

        if (callback) {
            var arrAnsw = [];
            arrAnsw[0] = arguments[0];
            arrAnsw[1] = arguments[1];
            arrAnsw[2] = arguments[2].replace(config.warningMsg, "").replace("\n", "");
            _this.log.info('...and call own callback with: ' + arrAnsw[1].replace("\n", "") + ", " + arrAnsw[2]);

	    var contRmAs=async(function(_this){
		    await(contRmAw(_this))
	    });
	    contRmAs(_this)
		.then(function(){
		    _this.log.info("Then in dockerExecutor");
		    callback.apply(_this, arrAnsw);
		});
        }
    };

    cp.exec(command, cpOptions, prepareCallback);

};

function contRmAw (_this){
    return function (callback) {
	var _sid= _this.getSessionId();
	var execCommand = _this.templates().rm
        .replace('{sessionId}', _sid);
	function cpRm(){
        _this.log.info('rm: '+execCommand);
	    cp.exec(execCommand, cpOptions, function(err){
		if(err){
		    _this.log.info('Error on rm: '+_sid, err);
		    _this.log.info('Try again at 100 ms');
		    setTimeout(cpRm,100);
		} else {
		    _this.log.info("...cb from rm container"+_sid);
		    callback();
		}
	    });
	}

	_this.log.info('..but before DockerExecutor must rm container '+_sid);

	cpRm();
    }
}

module.exports = DockerExecutor;
