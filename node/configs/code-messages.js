var MESSAGES = {
    200: 'OK',
    400: 'Bad Request',
	403: 'Forbidden',
    422: 'Unprocessable Entity',
    500: 'Internal server error'
};

function getMessageByHTTPCode (code) {
    if (!code || !MESSAGES[code]) {
        return 'Unknown HTTP code #' + code;
    }
    return MESSAGES[code];
}

module.exports = getMessageByHTTPCode;
