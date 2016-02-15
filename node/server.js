var express = require('express');
var bodyParser = require('body-parser');
var log = require('./modules/logger')(module);
var env = require('node-env-file');
var Queue = require('./modules/coderunnerQueue');
var queue = new Queue();
var validate = require('./modules/validator');
var getMessageByHTTPCode = require('./configs/code-messages.js');

// read configs to process.env
env(__dirname + '/.env');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// routes
app.post('/isolated-test', isolatedTestRoute);

// if route not found
app.use(function (req, res) {
    sendErrorResponse(res, 404, 'Route not found');
});

var server = app.listen(process.env.SERVER_PORT, function () {
    console.log('Running on http://localhost:' + process.env.SERVER_PORT);
});

function sendResponse (res, statusCode, code, data) {
    res.status(statusCode).json({code: code, response: data});
    res.end();
}

function sendErrorResponse (res, code, message) {
    log.error(message || getMessageByHTTPCode(code));

    res.status(code).json({'error': {'code': code, "message": message || getMessageByHTTPCode(code)}});

    res.end();
}

function isolatedTestRoute (req, res) {

    var lang = req.body.language;
    var code = (req.body.code);
    var testCases = req.body.testCases;

    if (lang && code && testCases) {
        var dataInspection = validate({code: code, testCases: testCases, language: lang});

        if (!dataInspection.validity) {
            sendResponse(res, 200, 422, dataInspection.log)
        }
    } else {
        sendErrorResponse(res, '400', 'Wrong parameters');
    }

    var id = new Date().getTime().toString();

    queue.push({sessionId: id, code: code, language: lang, testCases: testCases}, function (err, data) {
        if (err) {
            console.error(err.stack);
            sendErrorResponse(res, 500, 'Internal server error');
        } else {
            console.log("sending answer to user", data);
            sendResponse(res, 200, 200, data);
        }
    });
}
