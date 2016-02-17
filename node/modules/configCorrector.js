var config = require('../config.json');

function correctConfig(optional) {
    for (var property in optional) {
        changeProperty(property, parseInt(optional[property]));
    }
    return config;
}

function changeProperty(property, value) {
    if (value && value < config.userQuotes[property]) {
        config.userQuotes[property] = value;
    }
}

module.exports = correctConfig;
