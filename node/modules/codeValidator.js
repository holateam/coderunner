var config = require('../config.json');

function javaValidator(sourcecode, log) {
    var regPattern = /\b(import)\b[^;]*/;  //pattern for substring that starts with 'import' and end with ';'
    var endPattern = /;/; //end of pattern substring that starts with 'import'
    checkForbidenLibs(log, regPattern, endPattern, sourcecode.code, "acceptedJava");
    var regExp_Class = /\b(Class)\b/g; // pattern for find 'Class'
    findForbidenCode(sourcecode.code, regExp_Class, log, "Class");

    return sendResult(log);
}

function cppValidator(soursecode, log) {
    var regPattern = /(\n|^)\s*\u0023(.+)(\n|$)/;  //pattern for string that starts with any number of whitespace and contains any number of any symbols enclosed between '#' and '\n'
    var endPattern = /(\n|$)/; //end of pattern string that starts with '#'
    checkForbidenLibs(log, regPattern, endPattern, sourcecode.code, "acceptedCpp");
    var regExp_asm = /(\b|\u005F{2}|\b\u005F)(asm)(\b|\u005F{2})/; // pattern for find inline assembly (asm, _asm, __asm, __asm__)
    findForbidenCode(sourcecode.code, regExp_asm, log, "asm");

    return sendResult(log);
}

function phpValidator(soursecode, log) {
    return stub(soursecode.language);
}

function nodeValidator(soursecode, log) {
    return stub(soursecode.language);
}

function pythonValidator(soursecode, log) {
    return stub(soursecode.language);
}

function findForbidenCode (code, regExp, log, forbidenCode) {
    if(code.search(regExp) != -1) {
        addLog(log, 3, forbidenCode, "Not allowed to use");
    }
}

function checkForbidenLibs (log, regPattern, endPattern, sourcecode, includeProperty) {
    var pos, end_pos; // start and finish position of searching string
    var code = sourcecode;
    while ((pos = code.search(regPattern)) != -1) {
        code = code.substr(pos);
        end_pos = code.search(endPattern);
        var pattern = code.substr(0, end_pos);
        if (pattern.trim() && !config.quotes.includes[includeProperty][pattern.replace(/\s/g,'')]) {
            addLog(log, 2, pattern.trim(), "Not allowed to use");
        }
        code = code.substr(end_pos + 1);
    }
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

function validate(sourceData) {
    var logs = [];
    if (sourceData.code.length > config.quotes.codeLength) {
        addLog(logs, 1, "source code", "The characters limit exceeded");
        return sendResult(logs);
    }
    if (sourceData.language.toLowerCase() == 'java') {
        return javaValidator(sourceData, logs);
    } else if (sourceData.language.toLowerCase() == 'cpp') {
        return cppValidator(sourceData, logs);
    } if (sourceData.language.toLowerCase() == 'php') {
        return phpValidator(sourceData, logs);
    } if (sourceData.language.toLowerCase() == 'node') {
        return nodeValidator(sourceData, logs);
    } if (sourceData.language.toLowerCase() == 'python') {
        return pythonValidator(sourceData);
    }
    return false;
}


function  stub(lang) {
    return {validity: false, log: [{"danger-level": 1, "text": lang, "comment": "Sorry, this language is not supported yet"}]};
}


module.exports = validate;
