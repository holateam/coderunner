var conf        = require('./../config.json');
var ArgEx       = require('./exceptions/illegalarg').IllegalArgumentException;
var cp          = require('child_process');

function DockerRunner(){} 

DockerRunner.prototype.run = function(options) {

    if (!options)
        throw new ArgEx('you must pass options object as argument');

    var opt = {
        sessionId   : options.sessionId || null,
        code        : options.code      || null,
        language    : options.language  || null,
        testCases   : options.testCases || null,
        callback    : options.callback  || null
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
    var docketSharedDir = conf.docketSharedDir;
    var sessionDir      = docketSharedDir + "/" + opt.sessionId;
    var dockerDir       = conf.dockerDir + "/" + lang;
    var containerPath   = dockerDir + "/container";
    var params          = '-d --net none -v /'+opt.sessionId+' '+sessionDir;

    var errHandler = function (err) {
        if (err) throw err;
    }

    // preparing shared files
    cp.exec("mkdir " + sessionDir + " " + sessionDir + "/input & echo -e '"+opt.code+"' >> " + sessionDir+"/input/code", errHandler);
    // creating empty response object
    var response = {
        dockerError     : null,   
        compilerErrors  : null, 
        stdout          : [ ],
        stderr          : [ ],
        timestamps      : [ ]
    }

    // function to finalize testing from callback
    var finalize = function() {
        if (opt.callback)
            opt.callback(opt.sessionId, response);
    }

    // preparing compilation command and callback
    var compile_command = 'docker run ' + params + ' ' + containerPath + ' start ' + opt.sessionId;
    var compile_callback = function(err, stdout, stderr) {
        if (err)
            throw err;
        if (stderr) {
            response.compilerErrors = stderr;
            finalize();
        }
    }
    // execute compilation process
    cp.exec(compile_command, compile_callback);

    // single testcase execution function
    // used for sync beheviour
    var caseData = {
        caseIdx : 0,
        caseLimit : opt.testCases.length
    }
    var params = '-d --net none -a stdin -v /'+opt.sessionId+' '+sessionDir;
    var command = 'docker run ' + params + ' ' + containerPath + ' start ' + opt.sessionId;
    function runNextCase() {
        // prepare and execute testcases
        var testcase = opt.testCases[caseData.caseIdx++];
        var piped = 'echo -e \''+testcase+'\' | ' + command;
        cp.exec(piped, test_callback);
    }

    // testcse callback function
    var test_callback = function(err, stdout, stderr) {
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
    }

    runNextCase();

};

exports.DockerRunner = DockerRunner;
module.exports = DockerRunner;
