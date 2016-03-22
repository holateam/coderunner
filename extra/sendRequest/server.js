var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var uri = "http://163.172.128.212:5555/isolated-test";

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/request', routeRequest);
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use(function (req, res) {
    sendErrorResponse(res, 404, 'Route not found');
});

function sendErrorResponse (res, status, code, message) {
    res.status(status).json({'error': {'code': code, "message": message}});
    res.end();
}

function  routeRequest(req, res) {
    console.log("request: ", req.body);
    request(
        {
            method: 'POST',
            uri: uri,
            json: req.body
        },
        function (err, response, data){
            if (err) {
                console.log("ERROR", response);
                return sendErrorResponse (res, 200, 404, response);
            } else {
                console.log("request from server: ", data);
                res.status(200).json(data);
                res.end();
            }
        })
}

var server = app.listen(8423, function () {
    });