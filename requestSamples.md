### Примеры запросов:
Тип - POST , header content-type - application-json .
Тело:
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
 Не забываем слать запросы на правильный порт и путь:
 ```
 http://localhost:5555/isolated-test
 ```

##Пример запроса курлом
```
 curl -H "Content-Type: application/json" -X POST -d '{"userName": "any name","serverSecret": "key","code": "#include <iostream>\nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}","language":"cpp","testCases":["std1","std2"],"optionalConfig": {"taskLifetime": 5,"dockerMaxCores": 3,"dockerMaxMemory": 512}}' http://localhost:5555/isolated-test
```

```
curl -H "Content-Type: application/json" -X POST -d '{"userName": "any name","serverSecret": "key","code": "#include <iostream>\nusing namespace std;\nint main(){int a,b;\ncin >> a;cin >> b;\ncout<<a<<\" \"<<b<<\" \"<<\"res:\"<<a+b<<endl;\nfor(long i=0; i<100;i++){};return 0;}","language":"cpp", "testCases":["2 3","4 5"],"optionalConfig": {"taskLifetime": 5, "dockerMaxCores": 3, "dockerMaxMemory": 512}}' http://localhost:5555/isolated-test
```
