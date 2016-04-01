var test_req = require('../runTester.js');
var should = require('should');
var examples = require('../mergeTests.js');

describe('test_req', function () {

        for (var test in examples) {
            it('should return object array', function (done) {
                test_req(examples[test], function (err, response) {
                    if (err) return done(err);
                    response.should.be.instanceof(Array).and.have.lengthOf(examples[test].length);

                    describe(test, function () {
                        it('should equal example response', function () {
                            response.forEach(function (res, i) {
                                if (test == "error") {
                                    res.should.be.an.instanceOf(Object).and.have.property('error');
                                    res.test.should.be.an.instanceOf(Object).and.have.property('code', 'message');
                                } else {
                                    res.should.be.an.instanceOf(Object).and.have.property('code', 'response');
                                    if (test == "compilerErrors") {
                                        res["response"][test].should(null).not.be.ok();
                                    } else if (test == "stderr") {
                                        res["response"][test].should.not.be.empty;
                                    } else if (test == "stdout") {
                                        res["response"][test].forEach(function (result, idx) {
                                            result.should.equal(examples[test][i]["response"][test][idx]);
                                        });
                                    } else {
                                        res["response"].should.be.instanceof(Array).and.have.lengthOf(examples[test][i]["response"].length);
                                    }
                                }
                            })
                        })
                    });
                    done();
                });
            });
        }
});