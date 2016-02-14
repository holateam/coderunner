var conf        = require('./../config.json') || {supportedLangs:[]};
var ArgEx       = require('./exceptions/illegalarg').IllegalArgumentException;
var cp          = require('child_process');

function DockerRunner(){} 

DockerRunner.prototype.run = function(options, cb) {

    if (!options)
        finalize( new ArgEx('you must pass options object as argument') );

    var opt = {
        sessionId   : options.sessionId || null,
        code        : options.code      || null,
        language    : options.language  || null,
        testCases   : options.testCases || null,
        callback    : cb || null
    };

    // validate parameters
    if (!opt.sessionId)
        finalize( new ArgEx('options.sessionId must be defined') );
    if (!opt.code)
        finalize( new ArgEx('options.code must be defined') );
    if (!opt.language)
        finalize( new ArgEx('options.language must be defined') );
    if (!opt.testCases)
        finalize( new ArgEx('options.testCases must be defined') );

    var lang = null;
    for (var i = 0; i < conf.supportedLangs.length; i++) {
        if (conf.supportedLangs[i] == opt.language) {
            lang = opt.language;
            break;
        }
    }
    if (!lang)
        finalize( new ArgEx('language '+opt.language+' is unsupported, use one of those: ' + String(conf.supportedLangs)) );

    // preparing variables
    var docketSharedDir = '/home/vladimir/Desktop'; //conf.docketSharedDir;
    var sessionDir      = docketSharedDir + "/" + opt.sessionId;
    //var dockerDir       = ""; //conf.dockerDir + "/" + lang;
    var containerPath   = "cpp_img"; //dockerDir + "/container";
    var params          = '-a stdin -a stdout -a stderr --net none -v '+docketSharedDir+'/'+opt.sessionId+':/opt/data'; //opt.sessionId+':'+sessionDir;

    // preparing shared files
    //cp.exec("mkdir " + sessionDir + " " + sessionDir + "/input & echo -e '"+opt.code+"' >> " + sessionDir+"/input/code", errHandler);
    cp.exec("mkdir " + sessionDir);
    cp.exec("mkdir " + sessionDir + "/input");
    cp.exec("echo '"+opt.code+"' >> " + sessionDir+"/input/code");
    okGoodLetsGo();

    //cp.exec("mkdir " + sessionDir + " " + sessionDir + "/input", function(err) {
    //    if (err) console.log(err);
    //    cp.exec("echo -e '"+opt.code+"' >> " + sessionDir+"/input/code", function (err) {
    //        if (err)
    //            return cb(e);
    //        okGoodLetsGo();
    //    });
    //});

    function okGoodLetsGo() {
        // creating empty response object
        var response = {
            dockerError: null,
            compilerErrors: null,
            stdout: [],
            stderr: [],
            timestamps: []
        };

        // function to finalize testing from callback
        var finalize = function (err) {
            if (opt.callback) {
                var tempcb = opt.callback ;
                opt.callback = undefined;
                tempcb(err, response);
            }
        };

        // preparing compilation command and callback
        var compile_command = 'docker run ' + params + ' ' + containerPath + ' start '; // + opt.sessionId;
        var compile_callback = function (err, stdout, stderr) {
            console.log("returned from docker: ", stdout, stderr, err);
            if (err) {
                console.log("err: ", err);
                finalize(err);
            }
            if (stderr) {
                console.log("stderr: ", stderr);
                response.compilerErrors = stderr;
                finalize();
            } else {
                console.log("result: ", stdout);
            }
        };
        // execute compilation process
        cp.exec(compile_command, compile_callback);
    }

    // single test case execution function
    // used for sync behaviour
/*
    var caseData = {
        caseIdx : 0,
        caseLimit : opt.testCases.length
    };

    var params = ' --net none -a stdin -v '+docketSharedDir+'/'+opt.sessionId+':/opt/data';
    var command = 'docker run ' + params + ' ' + containerPath + ' start '; //+ opt.sessionId
    function runNextCase() {
        // prepare and execute testcases
        var testcase = opt.testCases[caseData.caseIdx++];
        var piped = 'echo -e \''+testcase+'\' | ' + command;
        cp.exec(piped, test_callback);
    }

    // testcse callback function
    var test_callback = function(err, stdout, stderr) {
        if (err)
            finalize(err);
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
*/
};

exports.DockerRunner = DockerRunner;
module.exports = DockerRunner;
