/**
 * Created by karponter on 25.02.16.
 */

function functionSequence(errorCallback) {
    this.sequence = [];
    this.errorCallback = errorCallback;
}

functionSequence.prototype.add = function(func) {
    this.sequence.push(func);
};

functionSequence.prototype.execute = function() {
    var action = this.sequence[0];
    this.sequence.shift();
    if (action) {
        try {
            action(this.execute.bind(this));
        } catch (e) {
            this.errorCallback(e);
        }
    }
};

module.exports = functionSequence;
