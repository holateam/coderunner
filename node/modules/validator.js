function javaValidator(code) {
    return {validity: true, log: null};
};
function cppValidator(code) {
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
        return cppValidator(soursecode.code);
    } if (lang == 'php') {
        return phpValidator(soursecode.code);
    } if (lang == 'node') {
        return nodeValidator(soursecode.code);
    } if (lang == 'python') {
        return pythonValidator(soursecode.code);
    }
    return false;
}

module.exports = validate;
