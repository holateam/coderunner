var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var log = require('./moduls/logger')(module);

var queue = require('./moduls/queue');
var validate = require('./moduls/validator');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var msg = {
    200: 'OK',
    400: 'Bad Request',
    422: 'Unprocessable Entity',
    500: 'Internal server error'
};


app.post('/isolatedTest', function (req, res) {
    // /isolatedTest?key=securityCode
    var securityCode = req.query.key;
    validateKey(securityCode);

    var lang = req.body.language;
    var code = req.body.code;
    var testCases = req.body.testCases;
    if (lang && code && testCases) {
        var dataInspection = validate({code: code, language: lang});
        if (!dataInspection.validity) {
            sendResponse(res, 200, 422, dataInspection.log)
        }
    }
    else
        sendErrorRes(res, '400');
    var id = new Date().getTime().toString();
    queue.enqueue({id: {code: code, language: leng, testCases: testCases}}, function (err, data) {
        if (err)
            throw err;
        sendResponse(res, 200, 200, data);
    });


});


function sendResponse (res, statusCode, code, data) {
    res.status(statusCode);
    res.json({code : code, response: data});
    res.end;
}


function validateKey(key) {
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