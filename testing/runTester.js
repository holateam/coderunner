var request = require('request');
var tests = require('./tests_examples');
var uri = "http://localhost:5555/isolated-test";



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
                console.log('error: ', response);
                return callback(error);
            }  else {
                var log = [];

                if (body.error) {
                    if (tests[i].resBody.error) {
                        if (body.error.code != tests[i].resBody.error.code) {
                            addlog(log, "code", body.error.code, tests[i].resBody.error.code);
                        }
                    } else {
                        addlog(log, "wrong response", "error", "code " + tests[i].resBody.code);
                    }
                } else if (body.code == 422) {
                    if (tests[i].resBody.code == 422) {
                        try {
                            body.response.forEach(function (res, idx) {
                                if (res["danger-level"] !== tests[i].resBody.response[idx]["danger-level"]) {
                                    addlog(log, idx, res["danger-level"], tests[i].resBody.response[idx]["danger-level"]);
                                }
                            });
                        } catch (e){
                            addlog(log, "wrong response", JSON.stringify(body.response), JSON.stringify(tests[i].resBody));
                        }
                    } else {
                        addlog(log, "wrong response", "code 422", "code " + tests[i].resBody.code);
                    }
                } else if (body.code == 200) {
                    if (tests[i].resBody.code == 200) {
                        var stdout = tests[i].resBody.response.stdout;
                        body.response.stdout.forEach(function (res, idx) {
                            if (res !== stdout[idx]) {
                                addlog(log, idx, res, stdout[idx]);
                            }
                        });
                    }
                }
            }

            var status = (log.length > 0) ? "fail" : "success";
            callback(error, {test: status, "log": log});
        });
}

function addlog(log, diff, res, sample) {
    log.push({"diff": diff, "res": res, "sample": sample});
}

function isEmpty(log) {
    return (log.length == 0);
}
