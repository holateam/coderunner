var conf        = require('./../config.json') || {supportedLangs:[]};
var ArgEx       = require('./exceptions/illegalarg').IllegalArgumentException;
var cp          = require('child_process');
var fs          = require('fs');

var cpOptions   = {
    encoding: 'utf8',
    timeout: parseInt(conf.dockerLifetime) * 1000,
    killSignal: 'SIGKILL'
};

function DockerRunner(){}

DockerRunner.prototype.run = function(options, cb) {

    if (!options)
        throw new ArgEx('you must pass options object as argument');

    var opt = {
        sessionId   : options.sessionId || null,
        code        : options.code      || null,
        language    : options.language  || null,
        testCases   : options.testCases || null,
        callback    : cb || null
    };

    // validate parameters
    if (!opt.sessionId)
        throw new ArgEx('options.sessionId must be defined');
    if (!opt.code)
        throw new ArgEx('options.code must be defined');
    if (!opt.language)
        throw new ArgEx('options.language must be defined');
    if (!opt.testCases)
        throw new ArgEx('options.testCases must be defined');

    var lang = null;
    for (var i = 0; i < conf.supportedLangs.length; i++) {
        if (conf.supportedLangs[i] == opt.language) {
            lang = opt.language;
            break;
        }
    }
    if (!lang)
        throw new ArgEx('language '+opt.language+' is unsupported, use one of those: ' + String(conf.supportedLangs));

    // preparing variables
    var pwd = fs.realpathSync('.');
    console.log("pwd:", pwd);
    var dockerSharedDir = pwd+"/shared";//conf.dockerSharedDir;
    var sessionDir      = dockerSharedDir + "/" + opt.sessionId;
    var containerPath   = "cpp_img";
    var params          = '--net none -v '+sessionDir+':/opt/data'; //-a stdin -a stdout -a stderr

    // preparing shared files

    console.log("try to make dirs",sessionDir);
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
                okGoodLetsGo();
            });
            //cp.exec("echo '"+opt.code+"' >> "+sessionDir+"/input/code", function (err) {
            //    if (err){
            //        console.log("Error writing code file");
            //        return cb(err);
            //    }
            //    console.log("Running code file");
            //    okGoodLetsGo();
            //});
        });
    });

    // function to finalize testing from callback
    var finalize = function () {
        console.log("finalizing");
        if (opt.callback)
            opt.callback(opt.sessionId, response);
    };

    // creating empty response object
    var response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };

    function okGoodLetsGo() {
        // preparing compilation command and callback
        var compileCommand = 'docker run ' + params + ' ' + containerPath + ' startcompile'; // + opt.sessionId;

        var compileCallback = function (err, stdout, stderr) {
            console.log("returned from compile-docker: ", stdout, stderr, err);
            if (err) {
                console.log("err: ", err);
                throw err;
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

        var params = '--net none -i -v '+sessionDir+':/opt/data'; //opt.sessionId+':'+sessionDir;
        var command = 'docker run ' + params + ' ' + containerPath + ' start '; //+ opt.sessionId

        function runNextCase() {
            // prepare and execute testcases
            var testCase = opt.testCases[caseData.caseIdx++];
            var piped = 'echo \"'+testCase+'\" | ' + command;
            console.log("test", piped);
            cp.exec(piped, cpOptions, testCallback);
        }

        // testcase callback function
        var testCallback = function(err, stdout, stderr) {
            console.log("testing callback",err, stdout, stderr);
            if (err)
                throw err;
            response.stdout.push(stdout);
            response.stderr.push(stderr);
            response.timestamps.push(0);

            console.log(caseData.caseIdx);

            if (caseData.caseIdx >= opt.testCases.length)
                finalize();
            else
                runNextCase();
        };

        runNextCase();
    }
};

exports.DockerRunner = DockerRunner;
module.exports = DockerRunner;
