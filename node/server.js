var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var log = require('./moduls/logger')(module);

var app = express();
var root = '~/.coderunner';

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//var request = {language: java,
//              code: "run(){}",
//              testCases: "["stdIn 1", "stdIn 2", "stdIn 3};


var msg = {
    200: 'OK',
    400: 'Bad Request',
    500: 'Internal server error'
};


app.post('/isolatedTest', function (req, res) {
    // /isolatedTest?key=securityCode
    var securityCode = req.query.key;
    validateKey(securityCode);

    var lang = req.body.language;
    var code = req.body.code;
    var testCases = req.body.testCases;
    if (lang && code && testCases)
        validateData(lang, code, testCases);
    else
        sendErrorRes(res, '400');

    var id = new Date().getTime().toString();
    enqueue(lang, code, testCases, id);


});

app.get('analyseTest/:sessionID', function (req, res) {
    var id = req.query.sessionID;
    var responseResult = {};
    var limitBuffer = 10;
    var outputPath = path.join(root, 'output');
    var filePath = path.join(outputPath, id);
    fs.exists(outputPath, function (exists) {
        if (err)
           throw err;
        else {
            fs.stat(filePath, function(err, stats) {
                if (err || !stats.isFile()) {
                    throw err;
                } else {
                    var file = new fs.ReadStream(filePath, {encoding: 'utf-8'});
                    file.on('readable', function() {
                        if (limitBuffer)
                            var data = file.read();
                        else
                            file.destroy();
                        limitBuffer--;
                    });
                    file.on('end', function() {
                        parseFileToJson(file);
                    });
                    file.on('err', function(err) {
                        throw err;
                    });
                }
            });
        }
    });
});

function parseFileToJson(file) {
    var responseObj = {};
    /*{
     compiler errors: "",
     stdout : [ “testcase1 otp”, “testcase2 otp” ],
     stderr : [ “testcase1 err”, “testcase2 err” ],
     timestamps : [ “testcase1 duration”, “testcase2 duration” ]
     }*/
    return responseObj;
};


function validateKey(key) {

};

function validateData(lang, code, testCases) {

};

function enqueue(lang, code, testCases, sessionId) {

};


function sendErrorRes(res, code) {
    log.error(msg[code]);
    res.status(code);
    res.send({'error': {'code': code, "message": msg[code]}});
}

app.use(function (err, req, res) {
    sendErrorRes(res, 500);
});

var server = app.listen(3351, function () {
    console.log('Running on http://localhost:3351');
});