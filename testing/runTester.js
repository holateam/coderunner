var request = require('request');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var tests = require('./tests_examples');
var uri = "http://54.213.253.8:5555/isolated-test";


var config = require('../node/config.json');
var taskLifetime = config.userQuotes.taskLifetime * 1000;

var testCounter = tests.length;


var runTester = function () {
    return function (cb) {
        for (var i = 0; i < tests.length; i++) {
            try {
                sendRequest(i, cb);
            } catch (e) {
                console.log("catch: " + e);
            }
        }
    }
};

var start = async(function  () {
    console.log('========================================start process testing==================================================');
    await(runTester());
});

start().then(function () {
    console.log('============================================end process testing=================================================');
});



function sendRequest(i, cb) {
    request(
        {
            method: 'POST',
            uri: uri,
            json: tests[i].req
        },
        function (error, response, body){
            if (error) {
                console.log();
                console.log(error);
                testCounterDecrement(cb);
            } else {
                compareTests(error, response, body, i, cb);
            }
        }
    );
}



var compareTests = function (error, response, body, i, cb) {

    var log = [];

    if (body.error) {
        try {
            if (body.error.code != tests[i].resBody.error.code) {
                addlog(log, "code", body.error.code, tests[i].resBody.error.code);
            }
        } catch (e) {
            logException(log, e, body.response, tests[i].resBody);
        }
    } else if (body.code == 422) {
        try {
            body.response.forEach(function (res, idx) {
                if (res["danger-level"] !== tests[i].resBody.response[idx]["danger-level"]) {
                    addlog(log, idx, res["danger-level"], tests[i].resBody.response[idx]["danger-level"]);
                }
            });
        } catch (e) {
            logException(log, e, body.response, tests[i].resBody);
        }
    } else if (body.code == 200) {
        compareResponse200(log, body, i);
    }

    var status = (log.length > 0) ? "fail" : "success";
    var result = {test: status, "log": log};

    printResult(result, i, cb);

};

function printResult(result, i, cb) {
    console.log('TEST: ', tests[i].desc);
    console.log("RESULT: ", result);
    console.log('______________________________________________________________________________________________________');
    console.log();
    testCounterDecrement(cb);
}

function testCounterDecrement(cb) {
    testCounter--;
    if (testCounter == 0) {
        cb();
    }
}


function addlog(log, diff, res, pattern) {
    log.push({"diff": diff, "res": res, "pattern": pattern});
}

function logException (log, e, res, pattern) {
    addlog(log, e, JSON.stringify(res), JSON.stringify(pattern));
}

function compareResponse200(log, body, i) {
    try {
        var stdout = tests[i].resBody.response.stdout;
        body.response.stdout.forEach(function (res, idx) {
            if (res !== stdout[idx]) {
                addlog(log, idx, res, stdout[idx]);
            }
        });

        var stderr = tests[i].resBody.response.stderr;
        body.response.stderr.forEach(function (res, idx) {
            if ((res && !stderr[idx]) || (!res && stderr[idx])) {
                addlog(log, idx, res, stderr[idx]);
            }
        });

        compareResponseErrors(log, body, i, "dockerError");
        compareResponseErrors(log, body, i, "compilerErrors");

        var timestamps = tests[i].resBody.response.timestamps;
        body.response.timestamps.forEach(function (res, idx) {
            if (res > taskLifetime && (body.response.stderr[0].toLowerCase()).indexOf("time is out of running") == -1){
                addlog(log, idx, res, timestamps[idx]);
            }
        });

    } catch (e) {
        logException(log, e, body.response, tests[i].resBody);
    }
}



function compareResponseErrors(log, body, i, field) {
    if ((tests[i].resBody.response[field] && !body.response[field]) ||
        (!tests[i].resBody.response[field]  && body.response[field])) {
        addlog(log, field, body.response[field], tests[i].resBody.response[field]);
    }
}
