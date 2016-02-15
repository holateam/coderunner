var conf = require('./../config.json');

function Rejecter(){
	this.users 		= {};
	this.quote 		= conf.quote.tasksPerMinute;
	this.rage 		= conf.quote.rageCoefficient;
	this.patience 	= conf.quote.patience;
	this.timeCap 	= conf.requestAnaliticsTime;
};

Rejecter.prototype.getOverflow = function(userId, idx) {
	return this.users[userId].overflows[idx];
};

Rejecter.prototype.registerRequest = function(req, userId) {
	this.users[userId].requests.push(req);
};

Rejecter.prototype.closeOverflow = function(userId) {
	this.users[userId].overflows.push({ start : -1, end : -1 })
};

Rejecter.prototype.registerUser = function(userId) {
	if (this.users[userId] == undefined) {
		this.users[userId] = {
			overflows: [],
			requests : []
		};
		this.closeOverflow(userId);
	}
};

Rejecter.prototype.updateOverflow = function(userId, end) {
	var idx = this.users[userId].overflows.length-1;
	if (this.getOverflow(userId, idx).start < 0)
		this.users[userId].overflows[idx].start = end;
	this.users[userId].overflows[idx].end = end;
	console.log('updated:', this.users[userId].overflows[idx].start, this.users[userId].overflows[idx].end);
};

Rejecter.prototype.isRequestAllowed = function(userId) {

	this.registerUser(userId);

	var delay = 60000;
	var amount = 1;
	var patience = Math.exp(this.patience);

	var currentRequest = {
		time : (new Date()).getTime()
	}

	var userRequests = this.users[userId].requests;

	for (var i = userRequests.length - 1; i > -1; i--) {
		var delay = currentRequest.time - userRequests[i].time;
		// console.log('delay:', delay);
		if (delay >= this.timeCap) {
			break;
		} else {
			amount++;
		}
		delay = this.timeCap;
	}

	this.registerRequest(currentRequest, userId);

	var frequency = amount * this.timeCap / delay;
	// console.log('frequency:', frequency, "=" ,amount, "*", this.timeCap, "/", delay);

	if (frequency <= this.quote) {

		var idx = this.users[userId].overflows.length-1;
		if (this.users[userId].overflows[idx].start > 0)
			this.closeOverflow(userId);
		return true;

	} else {

		if (frequency > this.rage) {
			return false;
		}

		this.updateOverflow(userId, currentRequest.time);

		// console.log(this.users[userId].overflows.length);
		for (var o = 0; o < this.users[userId].overflows.length; o++) {

			var overflow = this.getOverflow(userId, o);
			var timePassed = currentRequest.time - overflow.end;
			// console.log('time passed:', timePassed);
			var duration = (overflow.end - overflow.start) / 1000;
			// console.log('duration:', duration);

			var weight = 1 - Math.exp(-1*this.timeCap/timePassed);
			var anger =  Math.exp(duration);
			patience -= weight * anger;

			// console.log('patience: ', patience, "=", weight, "*", anger);
			if (patience <= 0) {
				return false;
			}

		}

		return true;
	}
};
