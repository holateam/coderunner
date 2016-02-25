/**
 * Created by Vladimir on 11.02.2016.
 */
module.exports = RunnerQueue;

var log = require('./logger');

function RunnerQueue () {
    this.arrPendingTasks = [];
    this.workingTasksCounter = 0;

    var DockerRunner = require ('./dockerRunner');
    this.dockerRunner = new DockerRunner ();

    var config = require ('../config.json');
    this.maxWorkingTaskNumber = config.MaxWorkingTaskNumber;
}

RunnerQueue.prototype.push = function (taskObj, callbackFunction) {
    if (this.workingTasksCounter < this.maxWorkingTaskNumber) {
        log.info("Queue of working tasks has free places.");
        this.sendTaskToDockerRunner (taskObj, callbackFunction);
    } else {
        this.arrPendingTasks.push({task: taskObj, cb: callbackFunction});
        log.info("Queue is full. Task added to pending list " + taskObj.sessionId);
    }
};

RunnerQueue.prototype.sendTaskToDockerRunner = function (taskObj, callbackFunction) {
    var self = this;

    var returnFunc = function (err, result) {
        var sessionId=result.sessionId, answerObj=result.response;

        log.info("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

        self.workingTasksCounter--;

        if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
            var taskToSolve = self.arrPendingTasks.shift ();
            self.sendTaskToDockerRunner (taskToSolve.task, taskToSolve.cb);
        }

        log.info("Sending answer " + sessionId + " to API-server");
        callbackFunction (err, answerObj);
    };

    log.info("Sending task to DockerRunner", taskObj);

    this.dockerRunner.run (taskObj, returnFunc);
    this.workingTasksCounter++;
};

