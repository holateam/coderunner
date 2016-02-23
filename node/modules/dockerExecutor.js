var cp = require('child_process');
var log = require('./logger');

var cpOptions = {
    encoding: 'utf8',
    //timeout: parseInt(conf.userQuotes.taskLifetime) * 1000,
    killSignal: 'SIGKILL'
};

var config = require('./../config.json') || {supportedLangs: []};

function DockerExecutor (sessionId, imageName) {

    if (!sessionId) {
        throw Error('DockerExecutor:constructor wrong param sessionId');
    }

    if (!imageName) {
        throw Error('DockerExecutor:constructor wrong param imageName');
    }

    log.info('DockerExecutor init with the following params: ', sessionId, imageName);

    this.sessionId = sessionId;
    this.imageName = imageName;
    //noinspection JSUnresolvedVariable
    this.timeout = config.userQuotes.taskLifetime * 1000;
}

DockerExecutor.prototype.runTestCase = function (testCase, callback) {

    log.info('DockerExecutor run test case', testCase);

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
    log.info('DockerExecutor do kill');
    var executeCommand = this.templates().kill
        .replace('{sessionId}', this.getSessionId());

    this.run(executeCommand, null);
};

DockerExecutor.prototype.startCompile = function (callback) {

    log.info('DockerExecutor start to compile the code');

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
        'compile': 'docker run --name={sessionId} -m {dockerMaxMemory}m --net none --rm -v {sharedDir}:/opt/data {imageName} startcompile',
        'runTestCase': 'echo \"{testCase}\" | docker run --name={sessionId} -i -m {dockerMaxMemory}m --net none --rm -v {sharedDir}:/opt/data --log-driver=json-file --log-opt max-size=1k {imageName} start',
        'kill': 'docker kill {sessionId}'
    }
};

DockerExecutor.prototype.run = function (command, callback) {

    var _this = this;

    log.info('DockerExecutor run command >> ', command);

    var called = false;

    var prepareCallback = function () {
        log.info('DockerExecutor prepareCallback called');
        if (called) {
            return;
        }
        called = true;
        if (callback) {
            log.info('DockerExecutor call callback, args >> ', arguments);
            callback.apply(this, arguments);
        }
    };

    var onTimeout = function () {
        log.info('DockerExecutor timeout called after ', _this.timeout, 'ms');
        if (called) {
            return;
        }
        called = true;
        if (callback) {
            callback.apply(this, ['Time is out of running command >> ' + command, '', '']);
            _this.kill();
        }

        /** @ToDo kill container */
    };

    cp.exec(command, cpOptions, prepareCallback);

    setTimeout(onTimeout, _this.timeout);

};

module.exports = DockerExecutor;
