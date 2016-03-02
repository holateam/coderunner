
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var async = require('asyncawait/async');
var await = require('asyncawait/await');


var sendRequest = async.result (function(uri, body) {
    var response = {};
    await (request(
        {
            method: 'POST',
            uri: uri,
            json: body
        }
    ).then(function(incomingMsg){
        response.error = incomingMsg.error;
        response.statusCode = incomingMsg.statusCode;
        response.body = incomingMsg.body;
    }).catch(function(e){
        response.error = e;
    }));
    return response;
});


module.exports = sendRequest;
