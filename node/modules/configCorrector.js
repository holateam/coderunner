var config = require('../config.json');

function correctConfig(optional) {
    for (var property in optional) {
        if (!checkUserQuotes(property, parseInt(optional[property]))) {
            optional[property] = config.userQuotes[property];
        }
    }
}

function checkUserQuotes(property, value) {
    return (value && value < config.userQuotes[property]);
}

module.exports = correctConfig;
