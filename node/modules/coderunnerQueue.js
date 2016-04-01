'use strict';

/**
 * Created by Vladimir on 11.02.2016.
 */
var DockerRunner = require('./dockerRunner');
var Promise = require('bluebird');
var async = require('asyncawait/async');
var await = require('asyncawait/await');

class RunnerQueue {
    constructor() {
        this.arrPendingTasks = [];
        this.workingTasksCounter = 0;

        var config = require('../config.json');
        this.maxWorkingTaskNumber = config.MaxWorkingTaskNumber;

        this.DockerRunner = DockerRunner;
    }

    pushAsync(taskObj) {
        var _this = this;
        return function (callbackFunction) {
            _this.push(taskObj, callbackFunction);
        };
    }

    push(taskObj, callbackFunction) {
        if (this.workingTasksCounter < this.maxWorkingTaskNumber) {
            taskObj.log.info("Queue of working tasks has free places.");
            this.sendTaskToDockerRunner(taskObj, callbackFunction);
        } else {
            this.arrPendingTasks.push({task: taskObj, cb: callbackFunction});
            taskObj.log.info("Queue is full. Task added to pending list " + taskObj.sessionId);
        }
    }

    sendTaskToDockerRunner(taskObj, callbackFunction) {
        taskObj.log.info ("sending task to docker runner");
        var self = this;
        this.workingTasksCounter++;
        var asCode = async((task) => {
            var dockerRunner = new self.DockerRunner();
            var dockerRunnerAsync = Promise.promisifyAll(dockerRunner);
            var result = await(dockerRunnerAsync.runAsync(task));
            var sessionId = result.sessionId;
            var answerObj = result.response;

            task.log.info ("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

            self.workingTasksCounter--;

            if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
                var taskToSolve = self.arrPendingTasks.shift();
                self.sendTaskToDockerRunner(taskToSolve.task, taskToSolve.cb);
            }
            task.log.info("Sending answer " + sessionId + " to API-server");
            return answerObj;
        });

        if(taskObj.state){
            taskObj.state.started = true;
        }

        asCode(taskObj)
        .then((res) => {
            if(taskObj.state){
                taskObj.state.finished = true;
            }
            callbackFunction(null, res);
        })
        .catch((err) => {
            if(taskObj.state){
                taskObj.state.finished = true;
            }
            callbackFunction(err, null);
        });
    }
}

module.exports = RunnerQueue;
