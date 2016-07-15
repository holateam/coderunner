### Examples of requests:
Type - POST , header content-type - application-json .
Body:
 ```
 {
 "userName": "any name",
 "serverSecret": "key",
 "code": "#include <iostream> \nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}",
 "language":"cpp",
 "testCases":["std1","std2"],
 "optionalConfig": {
        "taskLifetime": 5,
        "dockerMaxCores": 3,
        "dockerMaxMemory": 512
    }
 }

 ```
 Don't forger to send requests to the correct port and path.
 ```
 http://localhost:5555/isolated-test
 ```

##Curl request example
```
 curl -H "Content-Type: application/json" -X POST -d '{"userName": "any name","serverSecret": "key","code": "#include <iostream>\nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}","language":"cpp","testCases":["std1","std2"],"optionalConfig": {"taskLifetime": 5,"dockerMaxCores": 3,"dockerMaxMemory": 512}}' http://localhost:5555/isolated-test
```

```
curl -H "Content-Type: application/json" -X POST -d '{"userName": "any name","serverSecret": "key","code": "#include <iostream>\nusing namespace std;\nint main(){int a,b;\ncin >> a;cin >> b;\ncout<<a<<\" \"<<b<<\" \"<<\"res:\"<<a+b<<endl;\nfor(long i=0; i<100;i++){};return 0;}","language":"cpp", "testCases":["2 3","4 5"],"optionalConfig": {"taskLifetime": 5, "dockerMaxCores": 3, "dockerMaxMemory": 512}}' http://localhost:5555/isolated-test
```


##Java source code request example
```
{
 "userName": "any name",
 "serverSecret": "key",
 "code": "class HelloWorld {public static void main(String[] args) {System.out.println(\"Hello World!\");}}",
 "language":"java",
 "testCases":["std1","std2"],
 "optionalConfig": {
        "taskLifetime": 5,
        "dockerMaxCores": 3,
        "dockerMaxMemory": 512
    }
 }
```
