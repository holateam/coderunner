
Rejecter(){
	this.users = {};
};

Rejecter.prototype.askFor = function(userId) {
	if (this.users[userId] == undefined) {
		this.users[userId] = [];
	}
	return true;
}

exports.DockerRunner = DockerRunner;