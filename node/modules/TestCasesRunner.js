/**
 * Created by vladimir on 20.02.16.
 */
var log = require('./logger');
var conf = require('./../config.json') || {supportedLangs: []};

module.exports = TestCasesRunner = function () {
    this.arrTestCases = [];
    this.currentTestCase = -1;
    this.response = {
        stdout: [],
        stderr: [],
        timestamps: []
    };
};

TestCasesRunner.prototype.setTestCases = function (arrTestCases) {
    this.arrTestCases = arrTestCases;
};

TestCasesRunner.prototype.run = function (dockerExecutor, callback) {
    this.callback = callback;
    this.dockerExecutor = dockerExecutor;
    this.runNextCase();
};

TestCasesRunner.prototype.runNextCase = function () {
    this.currentTestCase++;
    log.info("Running testcase", this.currentTestCase);

    if (this.currentTestCase == this.arrTestCases.length) {
        log.info("...testcases finished");
        this.callback(this.response);
        return;
    }

    var testCase = this.arrTestCases[this.currentTestCase];

    // saving execution start time
    this.lastCaseStart = (new Date()).getTime();

    var _this = this;

    var testCallback = function (err, stdout, stderr) {

        log.info("...returned from dockerExecutor to TestCasesRunner with stdout: " + stdout.replace("\n", "") + ', err: ' + err + stderr.replace("\n", ""));

        var time = (new Date()).getTime();

        if (stderr == conf.warningMsg)
            stderr = "";

        if (err) {
            log.error("testcase called with the following error: ", err);
            if ("" + err == "Error: stdout maxBuffer exceeded") {
                stderr += "" + err;
            } else if (err.code == 137) {
                stderr += "Process killed by timeout.";
            } else {
                stderr += "" + err;
            }
        }

        _this.response.stdout.push(stdout);
        _this.response.stderr.push(stderr);
        _this.response.timestamps.push(time - _this.lastCaseStart);

        _this.runNextCase();
    };

    // executing testcase
    log.info("TestCasesRunner exec dockerExecutor with ", testCase);

    this.dockerExecutor.runTestCase(testCase, testCallback);

};
