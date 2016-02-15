var config = require('../config.json');

function correctConfig(optional) {
    for (var property in optional) {
        changeProperty(property, optional[property]);
    }
    return config;
}

function changeProperty(property, value) {
    if (value && value < config.quotes[property]) {
        config.quotes[property] = value;
    }
}

module.exports = correctConfig;
