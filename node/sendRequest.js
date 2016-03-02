
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var async = require('asyncawait/async');
var await = require('asyncawait/await');


var sendRequest = async.result (function(uri, body) {
    console.log("into sendReques");
    var response = {};
    await (request(
        {
            method: 'POST',
            uri: uri,
            json: body
        }
    ).then(function(incomingMsg){
        console.log(incomingMsg.body);
        response.error = incomingMsg.error;
        response.response = incomingMsg.response;
        response.body = incomingMsg.body;
    }).catch(function(e){
        response.error = e;

    }));
    return response;
});


module.exports = sendRequest;
