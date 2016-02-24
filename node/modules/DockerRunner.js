var conf = require ('./../config.json') || {supportedLangs: []};
var ArgEx = require ('./exceptions/illegalarg').IllegalArgumentException;
var cp = require ('child_process');
var fs = require ('fs');
var log = require('./logger');

var cpOptions = {
    encoding: 'utf8',
    //timeout: parseInt(conf.userQuotes.taskLifetime) * 1000,
    killSignal: 'SIGKILL'
};

var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

function DockerRunner () {
}

DockerRunner.prototype.run = function (options, cb) {

    // creating empty response object
    var response = {
        dockerError: null,
        compilerErrors: null,
        stdout: [],
        stderr: [],
        timestamps: []
    };

    if (!options) {
        finalize (new ArgEx ('you must pass options object as argument'));
    }

    var opt = {
        sessionId: options.sessionId || null,
        code: options.code || null,
        language: options.language || null,
        testCases: options.testCases || null,
        callback: cb || null
    };

    // validate parameters
    if (!opt.sessionId) {
        finalize (new ArgEx ('options.sessionId must be defined'));
    }
    if (!opt.code) {
        finalize (new ArgEx ('options.code must be defined'));
    }
    if (!opt.language) {
        finalize (new ArgEx ('options.language must be defined'));
    }
    if (!opt.testCases) {
        finalize (new ArgEx ('options.testCases must be defined'));
    }

    var lang = null;
    //noinspection JSDuplicatedDeclaration
    for (var i = 0; i < conf.supportedLangs.length; i++) {
        if (conf.supportedLangs[i] == opt.language) {
            lang = opt.language;
            break;
        }
    }
    if (!lang) {
        var message = 'language ' + opt.language + ' is unsupported, use one of those: ' + String (conf.supportedLangs);
        finalize (new ArgEx (message));
    }

    // preparing variables
    
    var dockerSharedDir = conf.dockerSharedDir;
    var sessionDir = dockerSharedDir + "/" + opt.sessionId;
    var cpu_param = '0';
    //noinspection JSDuplicatedDeclaration,JSUnresolvedVariable
    for (var i = 1; i < conf.userQuotes.dockerMaxCores; i++) {
        cpu_param += ', ' + i;
    }
    //noinspection JSUnresolvedVariable
    var params = '--name=' + opt.sessionId + ' -m '+conf.userQuotes.dockerMaxMemory+'m --cpuset-cpus "'+cpu_param+'" --net none --rm -v '+sessionDir+':/opt/data';
    var containerPath = opt.language+"_img";

    // preparing shared files
    try {

        log.info('Preparing shared filesystem tree');

        fs.access(dockerSharedDir, fs.R_OK, (err) => {
            fs.mkdirSync(dockerSharedDir);
        });

        fs.access(sessionDir, fs.R_OK, (err) => {
            fs.mkdirSync(sessionDir);
        });

        fs.access(sessionDir + '/input', fs.R_OK, (err) => {
            fs.mkdirSync(sessionDir + '/input');
        });

        log.info('SElinux security fix for shared folder');
        cp.exec ("chcon -Rt svirt_sandbox_file_t " + sessionDir, function (err) {
            if (err) {
                log.error('Cannot fix SElinux access >> ', err);
            }
            log.info('Write code to file on Docker');
            fs.writeFile (sessionDir + "/input/code", opt.code, function (err) {
                if (err) {
                    log.error("Error writing code file", err);
                    return cb (err);
                }

                log.info('Starting to run the user code');

                try {
                    executionEntry();
                } catch (e) {
                    log.error('Error when execute user code ', e);
                }

            });
        });

    } catch (e) {
        log.error('Shared filesystem preparation error ', e);
    }

    //
    function executionEntry() {
        // preparing compilation command and callback
        var compileCommand = 'docker run ' + params + ' ' + containerPath + ' startcompile';

        var compileCallback = function (err, stdout, stderr) {

            log.info("returned from compile-docker: ", stdout || null, stderr || null, err || null);

            if (err) {
                finalize (err);
                /** @TODO Here is a trouble about compiling the code so we should parse it and if it's any
                 * docker error we should send message to the admin */
                return;
            }
            /** @TODO remove (stderr.substr(0,7)!="WARNING") */
            if (stderr && (stderr.substr(0,7)!="WARNING")) {
                response.compilerErrors = stderr;
                finalize ();
            } else {
                log.info('Code compiled');
                runTestCases ();
            }
        };
        // execute compilation process
        log.info("Running docker container: ", compileCommand);

        try {
            cp.exec (compileCommand, cpOptions, compileCallback);
        } catch (e) {
            log.error('Error trying to run docker container');
        }

    }

    // single test case execution function
    function runTestCases () {
        // used for sync behaviour
        var caseData = {
            timeoutId: null,
            lastCaseStart: 0,
            caseIdx: 0,
            caseLimit: opt.testCases.length
        };

        // var params = '--net none -i --rm -m 128MB -v ' + sessionDir + ':/opt/data';
        params += ' --log-driver=json-file --log-opt max-size=1k ';
        var command = 'docker run ' + params + ' --name=' + opt.sessionId + ' ' + containerPath + ' start';

        // testcase callback function
        var testCallback = function (err, stdout, stderr) {
            log.info ("testcase callback called with the following params: ", err || 'null', stdout || 'null', stderr || 'null');
            var time = (new Date()).getTime();
            if (stderr.substr (0, 7) == "WARNING")
                stderr = "";

            if (err) {
                log.error("testcase called with the following error: ",err);
                if(""+err=="Error: stdout maxBuffer exceeded"){
                    stderr+=""+err;
                } else if (err.code==137) {
                    stderr+="Process killed by timeout.";
                } else {
                    stderr+=""+err;
                }
            }

            response.stdout.push (stdout);
            response.stderr.push (stderr);
            response.timestamps.push (time - caseData.lastCaseStart);

            if (caseData.timeoutId) {
                clearTimeout(caseData.timeoutId);
                caseData.timeoutId = null;
            }

            if (caseData.caseIdx >= opt.testCases.length) {
                finalize ();
            } else {
                runNextCase ();
            }
        };

        // prepare and execute testcases
        function runNextCase () {
            var testCase = opt.testCases[caseData.caseIdx++];
            var piped = 'echo \"' + testCase + '\" | ' + command;

            // saving execution start time
            caseData.lastCaseStart = (new Date()).getTime();

            // executing testcase
            cp.exec (piped, cpOptions, testCallback);

            var cmd = 'docker kill ' + opt.sessionId;
            //noinspection JSUnresolvedVariable
            caseData.timeoutId = setTimeout (function () {
                cp.exec (cmd);
                log.info("Time is out. Kill container: ", cmd);
            }, parseInt(conf.userQuotes.taskLifetime) * 1000);
        }

        runNextCase ();
    }

    // function to finalize testing from callback
    function finalize (err) {

        // logging errors
        if (err) {
            log.error('Finalizing with the following Error: ', err); 
        }

        // delete temporary folders
        deleteFolderRecursive(sessionDir);

        // call callback function
        if (opt.callback) {
            opt.callback (err, {sessionId: opt.sessionId, response: response});
        } else {
            log.error ('No callback for task');
        }

    }

};

exports.DockerRunner = DockerRunner;
module.exports = DockerRunner;
