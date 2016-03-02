var Promise = require('bluebird');

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
var uri = "http://nonscire.pp.ua/request-logger/logme.php";
var sendRequest = require('./sendRequest.js');
var selfVerification = require('./selfVerification');



// read configs to process.env
env(__dirname + '/.env');

var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


function pingRoute(req, res) {
    return Promise.resolve(selfVerification())
            .then((response)=> {
                if(response) {
                    res.sendStatus(200);
                } else {
                    res.sendStatus(403);
                }
            })
            .catch(console.log.bind(console));
}

app.get('/ping', pingRoute);


// routes
app.post('/isolated-test', isolatedTestRoute);

// if route not found
app.use(function (req, res) {
    sendErrorResponse("id", res, 404, 'Route not found');
});

var server = app.listen(process.env.SERVER_PORT, function () {
    log.info('Running on http://localhost:' + process.env.SERVER_PORT);
});



function sendResponse (id, res, statusCode, code, data) {
    saveOnServer({"sessionID": id, "response": {"code": code, "response": data}});
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json({code: code, response: data});
    res.end();
}

function sendErrorResponse (id, res, code, message) {
    message = message || getMessageByHTTPCode(code);
    log.error(message);
    saveOnServer({"sessionID": id, "response": {"error": {"code": code, "message": message}}});
    res.statusCode = code;
    res.statusMessage = message;
    res.setHeader('Content-Type', 'application/json');
    res.status(code).json({error: {code: code, message: message}});
    res.end();
}

function saveOnServer(data) {
    return Promise.resolve(sendRequest(uri, data))
            .then((response)=> {
                if(response.error) {
                    log.info("ERROR: " + response.error + ", could not send request: ", data);
                } else if (response.statusCode == 200) {
                    console.log("request was sent successfully");
                } else {
                    log.info("WARNING: code: " + response.statusCode + ", could not send request: ", data);
                }
            })
            .catch(console.log.bind(console));
}


function Log(id) {
    this.id=id;
    var logger = require('./modules/logger');
    this.info = function (msg) {
        var arg1 = arguments[1];
        if(arguments[1]==undefined)
            arg1 = "";
        logger.info(this.id, arguments[0], arg1);
    };
    this.error = function (msg) {
        var arg1 = arguments[1];
        if(arguments[1]==undefined)
            arg1 = "";
        logger.error(this.id, arguments[0], arg1);
    };
}

function isolatedTestRoute (req, res) {
    //var id = new Date().getTime().toString();
    var id = "" + Math.random();
    id = id.substr(2);

    var logNew = new Log(id);

    logNew.info("********************************************************************************************");
    logNew.info('Incoming request. Session ID:' + id + ' request: ', req.body);

    saveOnServer({"sessionID": id, "request": req.body});


    var userName = req.body.userName;
    var securityCode = req.body.serverSecret;
    if (userName && securityCode) {
        if (!validateKey(securityCode)) {
            return sendErrorResponse(id, res, '403', 'Access denied');
        }
    } else {
        return sendErrorResponse(id, res, '400', 'Wrong parameters');
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
            return sendResponse(id, res, 200, 422, dataInspection.log);
        }
    } else {
        return sendErrorResponse(id, res, '400', 'Wrong parameters');
    }

    var optionalConfig = req.body.optionalConfig;
    if (optionalConfig) {
        checkUserConfig(optionalConfig);
    }

    logNew.info(`Pushing request ${id} to the CoderunnerQueue`);

    /*let response = queue.push({sessionId: id, code: code, language: lang, testCases: testCases, config: optionalConfig, log: logNew});

    logNew.info(`...return from CoderunnerQueue to API-server. Task ID ${id}`);

    response.data.codeRunnerVersion = config.version;

    if (response.error) {
        sendErrorResponse(id, res, 500, 'Internal server error');
    } else {
        logNew.info("Sending answer to " + id + ": ", response.data);
        sendResponse(id, res, 200, 200, response.data);
    }*/
    queue.push({sessionId: id, code: code, language: lang, testCases: testCases, config: optionalConfig, log: logNew}, function (err, data) {

        logNew.info("...return from CoderunnerQueue to API-server. Task ID " + id);

        data.codeRunnerVersion = config.version;

        if (err) {
            sendErrorResponse(id, res, 500, 'Internal server error');
        } else {
            logNew.info("Sending answer to " + id + ": ", data);
            sendResponse(id, res, 200, 200, data);
        }
    });
}

function validateKey(key) {
    return (config.serverSecret == key);
}

