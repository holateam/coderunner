var tests = [];
var key = "key";
var test = {desc: "simple stdout",
            lang: "cpp",
            req: {
                "userName": "any name",
                "serverSecret": key,
                "code": "#include <iostream>   \n   #include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}",
                "language":"cpp",
                "testCases":["std1","std2"]
            },
            "resBody": {
                "code": 200,
                "response": {
                    "dockerError": null,
                    "compilerErrors": null,
                    "stdout": ["11111std1\n", "11111std2\n"],
                    "stderr": ["",""]
                }
            }
            };
tests.push(test);

//===============================================================================================================================================================================

test = {desc: "simple adding",
        lang: "cpp",
        req: {
            "userName": "any name",
            "serverSecret": key,
            "code": "#include <iostream>\nusing namespace std;\nint main(){int a = 0; \n int b = 0;\ncin >> a;cin >> b;\ncout<<a<<\" \"<<b<<\" \"<<\"res:\"<<a+b<<endl;\nfor(long i=0; i<100;i++){};return 0;}",
            "language":"cpp",
            "testCases":["2 3","4 5"]
        },
        "resBody": {
            "code": 200,
            "response": {
                "dockerError": null,
                "compilerErrors": null,
                "stdout": ["2 3 res:5\n", "4 5 res:9\n"],
                "stderr": ["", ""]
            }
        }
        };

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "wrong secret key",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": "secret_key",
        "code": "",
        "language":"",
        "testCases":[]
    },
    "resBody": {
        "error": {
            "code": "403",
            "message": "Access denied"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "suspicious cpp code",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream> \n #include <fstream> \n #include <thread> \n  __asm__()\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":[]
    },
    "resBody": {
        "code": 422,
        "response": [
            {
                "danger-level": 3,
                "text": "asm",
                "comment": "Not allowed to use"
            },
            {
                "danger-level": 2,
                "text": "#include <fstream>",
                "comment": "Not allowed to use"
            },
            {
                "danger-level": 2,
                "text": "#include <thread>",
                "comment": "Not allowed to use"
            }
        ]
    }
};

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "suspicious java code",
    lang: "java",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "import java.awt.*; \n import java.util.*; Class<> \n import java.util.Scanner; \npublic class Main {public static void main(String[] args) {System.out.println(\"Hello world\");}",
        "language":"java",
        "testCases":[]
    },
    "resBody": {
        "code": 422,
        "response": [
            {
                "danger-level": 2,
                "text": "import java.awt.*",
                "comment": "Not allowed to use"
            },
            {
                "danger-level": 2,
                "text": "import java.util.*",
                "comment": "Not allowed to use"
            },
            {
                "danger-level": 3,
                "text": "Class",
                "comment": "Not allowed to use"
            }
        ]
    }
};

tests.push(test);

//===============================================================================================================================================================================


test = {desc: "exeeded limit test cases",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":["std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2"]
    },
    "resBody": {
        "code": 422,
        "response": [
            {
                "danger-level": 1,
                "text": "Test Cases",
                "comment": "limit exceeded"
            }
        ]
    }
};

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "suspicious test cases",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream> \n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":["¬¢£¥§™","¥§™"]
    },
    "resBody": {
        "code": 422,
        "response": [
            {
                "danger-level": 2,
                "text": "Test case #1",
                "comment": "contains forbidden symbols"
            },
            {
                "danger-level": 2,
                "text": "Test case #2",
                "comment": "contains forbidden symbols"
            }
        ]
    }
};

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "exeeded charecters limit test cases",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream> \n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":["test1                                                                                                                                                                                          ","                                                                                                                                                                                      std2"]
    },
    "resBody": {
        "code": 422,
        "response": [
            {
                "danger-level": 1,
                "text": "Test case #1",
                "comment": "The characters limit exceeded"
            },
            {
                "danger-level": 1,
                "text": "Test case #2",
                "comment": "The characters limit exceeded"
            }
        ]
    }
};

tests.push(test);

//===============================================================================================================================================================================

test = {desc: "empty userName",
    lang: "cpp",
    req: {
        "userName": "",
        "serverSecret": key,
        "code": "#include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":["std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2"]
    },
    "resBody": {
        "error": {
            "code": "400",
            "message": "Wrong parameters"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================


test = {desc: "empty serverSecret",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": "",
        "code": "#include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":["std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2"]
    },
    "resBody": {
        "error": {
            "code": "400",
            "message": "Wrong parameters"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================


test = {desc: "empty code",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "",
        "language":"cpp",
        "testCases":["std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2"]
    },
    "resBody": {
        "error": {
            "code": "400",
            "message": "Wrong parameters"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================


test = {desc: "empty language",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"",
        "testCases":["std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2", "std1","std2"]
    },
    "resBody": {
        "error": {
            "code": "400",
            "message": "Wrong parameters"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================


test = {desc: "empty testCases",
    lang: "cpp",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "#include <iostream>\n using namespace std;\n int main() {string greeting;\n cin >> greeting;\n for(int i=0; i<10; i++){} \n cout<< greeting << endl;\n return 0;}",
        "language":"cpp",
        "testCases":[]
    },
    "resBody": {
        "error": {
            "code": "400",
            "message": "Wrong parameters"
        }
    }
};

tests.push(test);

//===============================================================================================================================================================================






module.exports = tests;
