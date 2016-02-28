/**
 * Created by Vladimir on 11.02.2016.
 */
module.exports = RunnerQueue;

function RunnerQueue () {
    this.arrPendingTasks = [];
    this.arrWorkingTasks = [];
    this.workingTasksCounter = 0;

    // remove this when all tests are finished
    //var DockerRunner = require('./testExec3');
    var DockerRunner = require ('./dockerRunner');
    this.dockerRunner = new DockerRunner ();

    var config = require ('../config.json');
    this.maxWorkingTaskNumber = config.MaxWorkingTaskNumber;
}

RunnerQueue.prototype.push = function (taskObj, callbackFunction) {
    if (this.workingTasksCounter < this.maxWorkingTaskNumber) {
        this.sendTaskToDockerRunner (taskObj, callbackFunction);
    } else {
        this.arrPendingTasks.push ({task: taskObj, cb: callbackFunction});
        console.log ("Task added to pending list", taskObj);
    }
};

RunnerQueue.prototype.sendTaskToDockerRunner = function (taskObj, callbackFunction) {
    var self = this;

    var returnFunc = function (err, result) {
        var sessionId=result.sessionId, answerObj=result.response;
        console.log ("Task solution received from docker-manager", sessionId, answerObj);
        self.workingTasksCounter--;

        if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
            var taskToSolve = self.arrPendingTasks.shift ();
            self.sendTaskToDockerRunner (taskToSolve.task, taskToSolve.cb);
        }
        console.log("send to server answer: ", answerObj);
        callbackFunction (err, answerObj);
    };

    console.log ("Task sent to docker-manager", taskObj);
    this.dockerRunner.run (taskObj, returnFunc);
    this.workingTasksCounter++;
};

// remove this when all tests are finished
//var dq=new RunnerQueue();
//dq.push({sessionId: "111"}, alldone);
//dq.push({sessionId: "222"}, alldone);
//dq.push({sessionId: "333"}, alldone);
//
//function alldone(answ){
//    console.log("That's all.", answ)
//}
