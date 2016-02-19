var conf        = require('./../config.json') || {supportedLangs:[]};
var ArgEx       = require('./exceptions/illegalarg').IllegalArgumentException;
var cp          = require('child_process');
var fs          = require('fs');

var cpOptions   = {
    encoding: 'utf8',
    //timeout: parseInt(conf.quotes.taskLifetime) * 1000,
    killSignal: 'SIGKILL'
};

console.log("cpOptions: ", cpOptions);

function DockerRunner(){
}

DockerRunner.prototype.run = function(options, cb) {

    // creating empty response object
    var response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };

    if (!options) {
        finalize( new ArgEx('you must pass options object as argument') );
    }

    var opt = {
        sessionId   : options.sessionId || null,
        code        : options.code      || null,
        language    : options.language  || null,
        testCases   : options.testCases || null,
        callback    : cb || null
    };

    // function to finalize testing from callback
    var finalize = function (err) {
        console.log("finalizing");
        if (opt.callback) {
            opt.callback(err, { sessionId:opt.sessionId, response:response });
        } else {
            if (err) {
                console.error(err);
            }
        }
    };

    // validate parameters
    if (!opt.sessionId) {
        finalize( new ArgEx('options.sessionId must be defined') );
    }
    if (!opt.code) {
        finalize( new ArgEx('options.code must be defined') );
    }
    if (!opt.language) {
        finalize( new ArgEx('options.language must be defined') );
    }
    if (!opt.testCases) {
        finalize( new ArgEx('options.testCases must be defined') );
    }

    var lang = null;
    for (var i = 0; i < conf.supportedLangs.length; i++) {
        if (conf.supportedLangs[i] == opt.language) {
            lang = opt.language;
            break;
        }
    }
    if (!lang) {
        var message = 'language '+opt.language+' is unsupported, use one of those: ' + String(conf.supportedLangs);
        finalize( new ArgEx(message) );
    }

    // preparing variables
    var pwd = fs.realpathSync('.');
    console.log("pwd:", pwd);
    var dockerSharedDir = pwd+"/shared";//conf.dockerSharedDir;
    var sessionDir      = dockerSharedDir + "/" + opt.sessionId;
    var cpu_param = '0';
    for (var i = 1; i < conf.quotes.dockerMaxCores; i++) {
        cpu_param += ', ' + i;
    }
    var params          = '-m '+conf.quotes.dockerMaxMemory+'m --cpuset "'+cpu_param+'" --net none --rm -v '+sessionDir+':/opt/data';
    var containerPath   = opt.language+"_img";

    // preparing shared files
    console.log("trying to make dirs",sessionDir);
    cp.exec("mkdir "+dockerSharedDir, function(err) {
        cp.exec("mkdir "+sessionDir+" "+sessionDir+"/input", function(err) {
            if (err) {
                console.log("err!");
                console.log(err);
            }
            console.log("writing code file");
            fs.writeFile(sessionDir+"/input/code", opt.code, function(err) {
                if(err) {
                    console.log("Error writing code file", err);
                    return cb(err);
                }
                console.log("The file was saved!");
                console.log("Running code file");
                executionEntry();
            });
        });
    });

    //
    function executionEntry() {
        // preparing compilation command and callback
        var compileCommand = 'docker run ' + params + ' ' + containerPath + ' startcompile';

        var compileCallback = function (err, stdout, stderr) {
            console.log("returned from compile-docker: ", stdout, stderr, err);
            if (err) {
                console.log("err: ", err);
                finalize(err);
            }
            if (stderr) {
                console.log("stderr: ", stderr);
                response.compilerErrors = stderr;
                finalize();
            } else {
                console.log("compiled ok.", stdout);
                runTestCases();
            }
        };

        // execute compilation process
        console.log("exec", compileCommand);
        cp.exec(compileCommand, cpOptions, compileCallback);
    }

    // single test case execution function
    function runTestCases(){
        // used for sync behaviour
        var caseData = {
            caseIdx : 0,
            caseLimit : opt.testCases.length
        };

        var params = '--name "'+opt.sessionId+'" -m '+conf.quotes.dockerMaxMemory+'m --cpuset "'+cpu_param+'" --net none --rm -v '+sessionDir+':/opt/data --log-driver=json-file --log-opt max-size=1k ';
        var command = 'docker run ' + params + ' ' + containerPath + ' start';
        
        var cmd='docker kill '+opt.sessionId;

        setTimeout(function(){
            cp.exec(cmd);
            console.log(cmd, " is executed on ", cp.exec);
        }, 3000);

        // testcase callback function
        var testCallback = function(err, stdout, stderr) {
            console.log("testing callback",err, stdout, stderr);
            //if (err) {
            //    console.log("err: ",err);
            //    if(""+err=="Error: stdout maxBuffer exceeded"){
            //        stderr=""+err;
            //    } else if(err.signal != 'SIGKILL'){
            //        finalize(err);
            //        console.log("err2: cont running");
            //        return;
            //    } else {
            //        stderr="Error. Process killed because overtime.";
            //        // kill runner process here!
            //    }
            //} else {
            //    stderr="";
            //}
            response.stdout.push(stdout);
            response.stderr.push(stderr);
            response.timestamps.push(0);

            console.log(caseData.caseIdx);

            if (caseData.caseIdx >= opt.testCases.length){
                finalize();
            } else {
                runNextCase();
            }
        };

        // prepare and execute testcases
        function runNextCase() {
            var testCase = opt.testCases[caseData.caseIdx++];
            var piped = 'echo \"'+testCase+'\" | ' + command;
            console.log("test", piped);
            cp.exec(piped, cpOptions, testCallback);
        }

        runNextCase();
    }
};

exports.DockerRunner = DockerRunner;
module.exports = DockerRunner;
