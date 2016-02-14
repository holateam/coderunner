/**
 * Created by Vladimir on 11.02.2016.
 */
module.exports = RunnerQueue;

function RunnerQueue() {
    this.arrPendingTasks = [];
    this.arrWorkingTasks = [];
    this.workingTasksCounter = 0;

    //var DockerRunner = require('./testExec3');
    var DockerRunner = require('./DockerRunner');
    this.dockerRunner = new DockerRunner();

    var config = require('../config.json');
    this.maxWorkingTaskNumber = config.MaxWorkingTaskNumber;
}

RunnerQueue.prototype.push = function (taskObj, callbackFunction) {
    if (this.workingTasksCounter < this.maxWorkingTaskNumber) {
        this.sendTaskToDockerRunner(taskObj, callbackFunction );
    } else {
        this.arrPendingTasks.push({ task: taskObj, cb: callbackFunction })
        console.log("Task added to pending list",taskObj);
    }
};

RunnerQueue.prototype.sendTaskToDockerRunner = function (taskObj, callbackFunction) {
    var self=this;

    var returnFunc = function (sessionId, answerObj) {
        function findIndex(sId, arrWorkingTasks) {
            var res=-1;
            for(var i=0;i<arrWorkingTasks.length;i++){
                if(arrWorkingTasks[i].task.sessionId==sId){
                    res=i;
                    break;
                }
            }
            return res;
        }

        console.log("Task solution received from docker-manager",sessionId);

        var indexOfTask=findIndex(sessionId,self.arrWorkingTasks);
        var callbackFunc=self.arrWorkingTasks[indexOfTask].cb;
        self.arrWorkingTasks.splice(indexOfTask,1);
        self.workingTasksCounter--;

        if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length>0)) {
            var taskToSolve=self.arrPendingTasks.shift();
            self.sendTaskToDockerRunner(taskToSolve.task, taskToSolve.cb);
        }

        callbackFunc(answerObj);
    };

    this.dockerRunner.run(taskObj, returnFunc);
    this.arrWorkingTasks.push({ task: taskObj, cb: callbackFunction} );
    this.workingTasksCounter++;
    console.log("Task sent to docker-manager",taskObj);
};

//var dq=new RunnerQueue();
//dq.push({sessionId: "111"}, alldone);
//dq.push({sessionId: "222"}, alldone);
//dq.push({sessionId: "333"}, alldone);
//
//function alldone(answ){
//    console.log("That's all.", answ)
//}
