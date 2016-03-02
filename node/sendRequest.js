
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));




function sendRequest (uri, body) {
    var response = {};
    return Promise.resolve(request(
        {
        method: 'POST',
        uri: uri,
        json: body
        }))
        .then((incomingMsg)=> {
        response.error = incomingMsg.error;
        response.statusCode = incomingMsg.statusCode;
        response.body = incomingMsg.body;
        return response;
        })
        .catch(console.log.bind(console));
}



module.exports = sendRequest;
