var config = require('./config.json');

function javaValidator(code) {
    return {validity: true, log: null};
};
function cppValidator(code) {
    //var deniedCommands = ['ofstream', 'stringstream', 'fwrite', 'fputc', 'fputs', 'fprintf'];
    if (code.length > config.quotes.codeLength)
        return {validity: false, log: "the characters limit exceeded"};
    code = code.replace(/asm/g,'aaa');
    code = code.replace(/(^|\n)\u0023(.+)/g,'');
    code = config.includes.acceptedCpp + code;
    console.log(code);
    return {validity: true, log: null};
};

function phpValidator(code) {
    return {validity: true, log: null};
};

function nodeValidator(code) {
    return {validity: true, log: null};
};

function pythonValidator(code) {
    return {validity: true, log: null};
};



function validate(soursecode) {
    var lang = soursecode.language;
    if (lang == 'java') {
        return javaValidator(soursecode.code);
    } else if (lang == 'cpp') {
        var response = cppValidator(soursecode.code);
        return response;
    } if (lang == 'php') {
        return phpValidator(soursecode.code);
    } if (lang == 'node') {
        return nodeValidator(soursecode.code);
    } if (lang == 'python') {
        return pythonValidator(soursecode.code);
    }
    return false;
}

//validate({code: "#include <set> \n#include <stringstream> \nfunction main {cin << a; string str = \"somestring\"}; asm(bed code) \n#include <vector> \n int lasma = 3", language: "cpp"})
module.exports = validate;
