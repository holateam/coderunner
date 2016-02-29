var express = require('express');
var bodyParser = require('body-parser');
var log = require('./modules/logger');
var env = require('node-env-file');
var validateCode = require('./modules/codeValidator');
var validateTestCases = require('./modules/testCasesValidator');
var getMessageByHTTPCode = require('./configs/code-messages.js');
var checkUserConfig = require('./modules/configCorrector.js');
var config = require('./config.json');
var Queue = require('./modules/coderunnerQueue');
var queue = new Queue();


// read configs to process.env
env(__dirname + '/.env');

var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// routes
app.post('/isolated-test', isolatedTestRoute);

// if route not found
app.use(function (req, res) {
    sendErrorResponse(res, 404, 'Route not found');
});

var server = app.listen(process.env.SERVER_PORT, function () {
    log.info('Running on http://localhost:' + process.env.SERVER_PORT);
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

    log.info("********************************************************************************************");
    log.info('Incoming request. Lng: ' + req.body.language + ", num testcases: " + req.body.testCases.length + ", code: " + req.body.code.substr(0, 50));

    var userName = req.body.userName;
    var securityCode = req.body.serverSecret;
    if (userName && securityCode) {
        if (!validateKey(securityCode)) {
            return sendErrorResponse(res, '403', 'Access denied');
        }
    } else {
        return sendErrorResponse(res, '400', 'Wrong parameters');
    }

    var lang = req.body.language;
    var code = (req.body.code);
    var testCases = req.body.testCases;
    if (lang && code && testCases) {
        var dataInspection = validateCode({code: code, language: lang});
        if (dataInspection.validity) {
            dataInspection = validateTestCases(testCases);
        }
        if (!dataInspection.validity) {
            return sendResponse(res, 200, 422, dataInspection.log);
        }
    } else {
        return sendErrorResponse(res, '400', 'Wrong parameters');
    }

    var optionalConfig = req.body.optionalConfig;
    if (optionalConfig) {
        checkUserConfig(optionalConfig);
    }

    //var id = new Date().getTime().toString();
    var id=""+Math.random(); id=id.substr(2);

    log.info("Pushing request " + id + " to the CoderunnerQueue");

    queue.push({sessionId: id, code: code, language: lang, testCases: testCases, config: optionalConfig}, function (err, data) {

        log.info("...return from CoderunnerQueue to API-server. Task ID " + id);

        data.codeRunnerVersion = config.version;

        if (err) {
            sendErrorResponse(res, 500, 'Internal server error');
        } else {
            log.info("Sending answer to " + id + ": ", data);
            sendResponse(res, 200, 200, data);
        }
    });
}

function validateKey(key) {
    return (config.serverSecret == key);
}
