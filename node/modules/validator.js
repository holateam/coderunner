var config = require('../config.json');

function javaValidator(soursecode) {
    return {validity: true, log: null};
}

function cppValidator(soursecode) {
    var log = [];
    soursecode.code = soursecode.code.replace(/asm/g,'aaa'); //rename all 'asm' to avoid assembler inserts

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



function validate(soursecode) {
    if (soursecode.code.length > config.quotes.codeLength) {
        return {validity: false, log: [{"danger-level": 1, "text": null, "comment": "The characters limit exceeded"}]};
    }
    if (soursecode.language == 'java') {
        return javaValidator(soursecode);
    } else if (soursecode.language == 'cpp') {
        return cppValidator(soursecode);
    } if (soursecode.language == 'php') {
        return phpValidator(soursecode);
    } if (soursecode.language == 'node') {
        return nodeValidator(soursecode);
    } if (soursecode.language == 'python') {
        return pythonValidator(soursecode);
    }
    return false;
}
/*var sdd={code: "#include <iostream> \n#include <set> \n#include <stringstream> \nfunction main {cin << a; string str = \"somestring\"}; asm(bed code) \n#include <vector> \n int lasma = 3", language: "cpp"};
validate(sdd);*/
module.exports = validate;
