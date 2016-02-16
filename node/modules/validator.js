var config = require('../config.json');

function javaValidator(soursecode) {
    return {validity: true, log: null};
}

function cppValidator(soursecode) {
    var log = [];
    var regExp_asm = /(\b|\u005F{2}|\b\u005F)(asm)(\b|\u005F{2})/; // pattern for find inline assembly (asm, _asm, __asm, __asm__)
    if(soursecode.code.search(regExp_asm) != -1) {
        log.push({"danger-level": 3, "text": "asm", "comment": "Not allowed to use"});
    }
    var pos, end_pos; // start and finish position of searching string
    var regPattern = /(\n|^)\s*\u0023(.+)(\n|$)/;  //pattern for string that starts with any number of whitespace and contains any number of any symbols enclosed between '#' and '\n'
    var end = /(\n|$)/; //end of pattern string that starts with '#'
    var code = soursecode.code;
    while ((pos = code.search(regPattern)) != -1) {
        code = code.substr(pos);
        end_pos = code.search(end);
        var pattern = code.substr(0, end_pos);
        if ((pattern.trim()) && !(pattern.replace(/\s/g,'') in config.includes.acceptedCpp)) {
            log.push({"danger-level": 2, "text": pattern.trim(), "comment": "Not allowed to use"});
        }
        code = code.substr(end_pos + 1);
    }

    if (log.length > 0)
        return {validity: false, log: log};
    return {validity: true, log: null};
}

function phpValidator(soursecode) {
    return {validity: true, log: null};
}

function nodeValidator(soursecode) {
    return {validity: true, log: null};
}

function pythonValidator(soursecode) {
    return {validity: true, log: null};
}



function validate(sourceData) {
    if (sourceData.code.length > config.quotes.codeLength) {
        return {validity: false, log: [{"danger-level": 1, "text": null, "comment": "The characters limit exceeded"}]};
    }
    if (sourceData.testCases.length > config.quotes.maxTestCases){
        return {validity: false, log: [{"danger-level": 1, "text": null, "comment": "Too many test cases"}]};
    }
    if (sourceData.language == 'java') {
        return javaValidator(sourceData);
    } else if (sourceData.language == 'cpp') {
        return cppValidator(sourceData);
    } if (sourceData.language == 'php') {
        return phpValidator(sourceData);
    } if (sourceData.language == 'node') {
        return nodeValidator(sourceData);
    } if (sourceData.language == 'python') {
        return pythonValidator(sourceData);
    }
    return false;
}

module.exports = validate;
