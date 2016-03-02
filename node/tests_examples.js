
var tests = [];
var key = "key";

test = {desc: "simple adding java",
    lang: "java",
    req: {
        "userName": "any name",
        "serverSecret": key,
        "code": "import java.util.Scanner;\n public class test {\n    public static void main(String[] args) {\n   Scanner in = new Scanner(System.in);\n        int a = in.nextInt();\n   int b = in.nextInt();\n        System.out.print(a+b);\n    }\n}",
        "language":"java",
        "testCases":["2 4", "4 5"]
    },
    "resBody": {
        "code": 200,
        "response": {
            "dockerError": null,
            "compilerErrors": null,
            "stdout": ["6", "9"],
            "stderr": ["", ""]
        }
    }
};

tests.push(test);


module.exports = tests;
