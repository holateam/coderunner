var request = require('request');
var tests = require('./tests_examples');
var uri = "http://54.213.253.8:5555/isolated-test";



console.log('========================================start process testing==================================================');
runTester(sendRequest, function () {
    console.log('============================================end process testing=================================================');
});


function runTester(sendRequest, mainCallback, i) {
    i = i || 0;
    if (i == tests.length) {
        return mainCallback();
    }
    sendRequest(i, function (err, data) {
        if (err) {
            console.log(err);
            return mainCallback();
        }
        console.log(i);
        console.log('TEST: ', tests[i].desc);
        console.log("RESULT: ", data);
        console.log('______________________________________________________________________________________________________');
        console.log();
        i++;
        runTester(sendRequest, mainCallback, i);
    })
}


function sendRequest(i, callback) {
    request(
        {
            method: 'POST',
            uri: uri,
            json: tests[i].req
        }
        , function (error, response, body) {
            if (error) {
                return callback(error);
            }  else {
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
                callback(error, {test: status, "log": log});
            }
        });
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
            if (res < timestamps) {
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
