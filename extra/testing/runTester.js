'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var tests = require('./tests_examples');
var uri = "http://163.172.128.212:5555/isolated-test";
var config = require('../../node/config.json');
var taskLifetime = config.userQuotes.taskLifetime * 1000;

var requests = tests.map(function (req) {
    return {method: 'POST', uri: uri, json: req.req};
});

Promise.all( requests.map(sendRequest) )
    .then((results)=> {
        results.forEach((res, idx)=> {
            var result = compareTests(res, idx);
            printResult(result, idx);
        });
    })
    .catch(console.log.bind(console));


function sendRequest(data) {

    return  Promise.resolve(request(data)).then(function (incomingMsg) {
        if (incomingMsg.error) {
            throw new Error(incomingMsg.error);
        } else {
            return incomingMsg.body;
        }
    });

}


var compareTests = function (body, i) {

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
    return {test: status, "log": log};


};

function printResult(result, i) {
    console.log('TEST: ', tests[i].desc);
    console.log("RESULT: ", result);
    console.log('______________________________________________________________________________________________________');
    console.log();
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
        body.response.stdout.forEach((res, idx)=> {
            if (res !== stdout[idx]) {
                addlog(log, idx, res, stdout[idx]);
            }
        });

        var stderr = tests[i].resBody.response.stderr;
        body.response.stderr.forEach((res, idx)=> {
            if ((res && !stderr[idx]) || (!res && stderr[idx])) {
                addlog(log, idx, res, stderr[idx]);
            }
        });

        compareResponseErrors(log, body, i, "dockerError");
        compareResponseErrors(log, body, i, "compilerErrors");

        var timestamps = tests[i].resBody.response.timestamps;
        body.response.timestamps.forEach((res, idx)=> {
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
