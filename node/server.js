var express = require('express');
var bodyParser = require('body-parser');
var log = require('./modules/logger')(module);

var Queue = require('./modules/coderunnerQueue');
var queue = new Queue();

var validate = require('./modules/validator');

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
    //validateKey(securityCode);
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
    queue.push({sessionId: id, code: code, language: lang, testCases: testCases}, function (err, data) {
        if (err)
            throw err;
        sendResponse(res, 200, 200, data);
    });


});

function sendResponse (res, statusCode, code, data) {
    res.status(statusCode).json({code : code, response: data});
    res.end();
}


function validateKey(key) {
};


function sendErrorRes(res, code) {
    log.error(msg[code]);
    res.status(code).json({'error': {'code': code, "message": msg[code]}});
    res.end();
}
app.use(function (err, req, res) {
    sendErrorRes(res, 500);
});

var server = app.listen(3351, function () {
    console.log('Running on http://localhost:3351');
});