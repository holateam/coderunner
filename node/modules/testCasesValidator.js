var convert = require('binstring');
var config = require('../config.json');

function validate(testCases) {
    var logs = [];
    //restricts the test cases number
    if (testCases.length > config.quotes.maxTestCases){
        addLog(logs, 1, "Test Cases", "limit exceeded");
        return sendResult(logs);
    }

    var regExp = /[\x00-\x0A\x0C\x0E-\x1F\x7F-\xFF]/; // pattern for ascii symbols (0-10, 12, 14-31, 127-255)
    //restricts length and use of special symbols in every test case
    for (var i = 0; i < testCases.length; i++) {
        //convert test case from UTF-8 to ASCII
        var convTestCase = convert(testCases[i], { in: 'utf8', out: 'binary' });
        var pos = -1;
        if (testCases[i].length > config.quotes.maxTestCasesLength) {
            addLog(logs, 1, "Test case #" + ++i, "The characters limit exceeded");
        } else if ((pos = testCases[i].search(regExp)) != -1) {
            addLog(logs, 2, "Test case #" + ++i, "contains forbidden symbols");
        }
    }
    return sendResult(logs);
}

function addLog(logs, dl, text, comment) {
    logs.push({"danger-level": dl, "text": text, "comment": comment});
}

function  sendResult(logs) {
    if (logs.length > 0) {
        return {validity: false, log: logs};
    } else {
        return {validity: true, log: null};
    }
}

module.exports = validate;
