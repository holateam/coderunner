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
        var self = this;
        this.workingTasksCounter++;

        var asCode = async(function (task) {
            var dockerRunner = new DockerRunner();
            var dockerRunnerAsync = Promise.promisifyAll(dockerRunner);
            var result = await(dockerRunnerAsync.runAsync(task));
            var sessionId = result.sessionId;
            var answerObj = result.response;

            task.log.info("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

            self.workingTasksCounter--;

            if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
                var taskToSolve = self.arrPendingTasks.shift();
                self.sendTaskToDockerRunner(taskToSolve.task, taskToSolve.cb);
            }
            task.log.info("Sending answer " + sessionId + " to API-server");
            return answerObj;
        });

        asCode(taskObj)
            .then(function (res) {
                callbackFunction(null, res);
            })
            .catch(function (err) {
                callbackFunction(err, null);
            });
    }
}

module.exports = RunnerQueue;

//function RunnerQueue () {
//    this.arrPendingTasks = [];
//    this.workingTasksCounter = 0;
//
//    var config = require ('../config.json');
//    this.maxWorkingTaskNumber = config.MaxWorkingTaskNumber;
//}

//RunnerQueue.prototype.pushAsync = function (taskObj) {
//    var _this = this;
//    return function (callbackFunction) {
//        _this.push(taskObj, callbackFunction);
//    }
//};

//RunnerQueue.prototype.push = function (taskObj, callbackFunction) {
//    if (this.workingTasksCounter < this.maxWorkingTaskNumber) {
//        taskObj.log.info("Queue of working tasks has free places.");
//        this.sendTaskToDockerRunner (taskObj, callbackFunction);
//    } else {
//        this.arrPendingTasks.push({task: taskObj, cb: callbackFunction});
//        taskObj.log.info("Queue is full. Task added to pending list " + taskObj.sessionId);
//    }
//};


//RunnerQueue.prototype.sendTaskToDockerRunner = function (taskObj, callbackFunction) {
//    var self = this;

    /*
    var returnFunc = function (err, result) {
        var sessionId=result.sessionId, answerObj=result.response;

        taskObj.log.info("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

        self.workingTasksCounter--;

        if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
            var taskToSolve = self.arrPendingTasks.shift ();
            self.sendTaskToDockerRunner (taskToSolve.task, taskToSolve.cb);
        }

        taskObj.log.info("Sending answer " + sessionId + " to API-server");
        callbackFunction (err, answerObj);
    };

    taskObj.log.info("Sending task to DockerRunner", taskObj);

    var dockerRunner = new DockerRunner();
    dockerRunner.run(taskObj, returnFunc);
     this.workingTasksCounter++;
     */

// asyncawait
/*
    this.workingTasksCounter++;

    var asCode = async(function (task) {
        var dockerRunner = new DockerRunner();
        var dockerRunnerAsync = Promise.promisifyAll(dockerRunner);

        var result = await(dockerRunnerAsync.runAsync(task));

        var sessionId = result.sessionId;
        var answerObj = result.response;

        task.log.info("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

        self.workingTasksCounter--;

        if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
            var taskToSolve = self.arrPendingTasks.shift();
            self.sendTaskToDockerRunner(taskToSolve.task, taskToSolve.cb);
        }

        task.log.info("Sending answer " + sessionId + " to API-server");
        return answerObj;
    });

    asCode(taskObj)
        .then(function (res) {
            callbackFunction(null, res);
        })
        .catch(function (err) {
            callbackFunction(err, null);
        });
 */

// promises
    /*
     this.workingTasksCounter++;

     var dockerRunner = new DockerRunner();
     var dockerRunnerAsync=Promise.promisifyAll(dockerRunner);
     dockerRunnerAsync.runAsync(taskObj)
     .then(function(result){
     var sessionId=result.sessionId;
     var answerObj=result.response;

     taskObj.log.info("...task solution " + sessionId + " received from docker-manager to coderunnerQueue");

     self.workingTasksCounter--;

     if ((self.workingTasksCounter < self.maxWorkingTaskNumber) && (self.arrPendingTasks.length > 0)) {
     var taskToSolve = self.arrPendingTasks.shift ();
     self.sendTaskToDockerRunner (taskToSolve.task, taskToSolve.cb);
     }

     taskObj.log.info("Sending answer " + sessionId + " to API-server");
     return answerObj;
     })
     .then (function(result){
     callbackFunction(null, result);
     })
     .catch  (function(err){
     callbackFunction(err, null);
     })
     */
//};
