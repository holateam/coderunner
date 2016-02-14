function IllegalArgumentException(sMessage) {
    this.name = "IllegalArgumentException";
    this.message = sMessage;
    this.stack = (new Error()).stack;
}
IllegalArgumentException.prototype = Object.create(Error.prototype);
IllegalArgumentException.prototype.constructor = IllegalArgumentException;

exports.IllegalArgumentException = IllegalArgumentException;