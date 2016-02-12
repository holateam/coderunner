function analyse (result) {
    if (result.compilerErrors) {
        result.compilerErrors = deleteAbsolutePath(result.compilerErrors);
        return {
            dockerError : result.dockerError,
            compilerErrors : result.compilerErrors,
            stdout : null,
            stderr : null,
            timestamps : null
        };
    }
    for (var i = 0; i < result.stdout.length; i++)
        result.stdout[i] = deleteAbsolutePath(result.stdout[i]);
    for (var i = 0; i < result.stderr.length; i++)
        result.stderr[i] = deleteAbsolutePath(result.stderr[i]);
    for (var i = 0; i < result.timestamps.length; i++)
        result.timestamps[i] = parseInt(result.timestamps[i]);
    return {
        dockerError : result.dockerError,
        compilerErrors : null,
        stdout : result.stdout,
        stderr : result.stderr,
        timestamps : result.timestamps
    };
}

function deleteAbsolutePath (string) {
    return string.replace(/\/([\w\d]+\/)+[^\.]+\.\w{1,5}/g,'');
}

module.exports = analyse;
