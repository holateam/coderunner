var config = require('../config.json');

function javaValidator(soursecode) {
    return sendResult([]);
        //stub(soursecode.language);
}

function cppValidator(soursecode) {
    var log = [];
    var regExp_asm = /(\b|\u005F{2}|\b\u005F)(asm)(\b|\u005F{2})/; // pattern for find inline assembly (asm, _asm, __asm, __asm__)
    if(soursecode.code.search(regExp_asm) != -1) {
        addLog(log, 3, "asm", "Not allowed to use");
    }
    var pos, end_pos; // start and finish position of searching string
    var regPattern = /(\n|^)\s*\u0023(.+)(\n|$)/;  //pattern for string that starts with any number of whitespace and contains any number of any symbols enclosed between '#' and '\n'
    var end = /(\n|$)/; //end of pattern string that starts with '#'
    var code = soursecode.code;
    while ((pos = code.search(regPattern)) != -1) {
        code = code.substr(pos);
        end_pos = code.search(end);
        var pattern = code.substr(0, end_pos);
        if (pattern.trim() && !config.quotes.includes.acceptedCpp[pattern.replace(/\s/g,'')]) {
            addLog(log, 2, pattern.trim(), "Not allowed to use");
        }
        code = code.substr(end_pos + 1);
    }

    return sendResult(log);
}

function phpValidator(soursecode) {
    return stub(soursecode.language);
}

function nodeValidator(soursecode) {
    return sendResult([]);
    //return stub(soursecode.language);
}

function pythonValidator(soursecode) {
    return stub(soursecode.language);
}



function validate(sourceData) {
    if (sourceData.code.length > config.quotes.codeLength) {
        var logs = [];
        addLog(logs, 1, "source code", "The characters limit exceeded");
        return sendResult(logs);
    }
    if (sourceData.language.toLowerCase() == 'java') {
        return javaValidator(sourceData);
    } else if (sourceData.language.toLowerCase() == 'cpp') {
        return cppValidator(sourceData);
    } if (sourceData.language.toLowerCase() == 'php') {
        return phpValidator(sourceData);
    }
    if (sourceData.language.toLowerCase() == 'js') {
        return nodeValidator(sourceData);
    } if (sourceData.language.toLowerCase() == 'python') {
        return pythonValidator(sourceData);
    }
    return false;
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

function  stub(lang) {
    return {validity: false, log: [{"danger-level": 1, "text": lang, "comment": "Sorry, this language is not supported yet"}]};
}

module.exports = validate;
