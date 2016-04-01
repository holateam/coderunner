var should = require('should');
var logger = require('../logger');

var Queue = require('../coderunnerQueue.js');

function DrStub () {
    this.run = function (task, cb) {
        var recFunc = function(){
            if (task.state.solved) {
                cb (null, task.taskResult);
            } else {
                setTimeout(recFunc, 50);
            }
        };
        setTimeout(recFunc, 50);
    };
}

describe ("RunnerQueue tests", function(){
    it("Check number of started & finished tasks", function (done) {
        var queue = new Queue();

        queue.DockerRunner = DrStub;
        queue.maxWorkingTaskNumber = 2;

        var arTasks=[];

        for (var i = 0; i<4; i++){
            var task = {log: logger, session: "__"+i,
                state: {started: false, finished: false, solved: false},
                taskResult: {sessionId: "__"+i, response: i*2}};
            arTasks.push (task);

            queue.push(task, function(err, res) {
                console.log("Task "+i+" solved!", res);
            });
        }

        console.log("tasks after push", arTasks);
        arTasks[0].state.should.eql({started: true,  finished: false, solved: false});
        arTasks[1].state.should.eql({started: true,  finished: false, solved: false});
        arTasks[2].state.should.eql({started: false, finished: false, solved: false});
        arTasks[3].state.should.eql({started: false, finished: false, solved: false});

        arTasks[0].state.solved = true;
        arTasks[1].state.solved = true;

        setTimeout(function(){
            console.log("tasks after two solved:", arTasks);
            arTasks[0].state.should.eql({started: true, finished: true, solved: true});
            arTasks[1].state.should.eql({started: true, finished: true, solved: true});
            arTasks[2].state.should.eql({started: true, finished: false, solved: false});
            arTasks[3].state.should.eql({started: true, finished: false, solved: false});
            done();
        }, 300);

    });
});
