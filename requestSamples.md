### Примеры запросов:
Тип - POST , header content-type - application-json .
Тело:
 ```
 {
 "userName": "any name",
 "serverSecret": "key",
 "code": ""#include <iostream>\n #include <cstdlib> \nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}"",
 "language":"cpp",
 "testCases":["std1","std2"],
 "optionalConfig": { 
        "taskLifetime": 5, 
        "maxTestCases": 5, 
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
 curl -H "Content-Type: application/json" -X POST -d '{"userName": "any name","serverSecret": "key","code": ""#include <iostream>\n #include <cstdlib> \nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}"","language":"cpp","testCases":["std1","std2"],"optionalConfig": {"taskLifetime": 5,"maxTestCases": 5,"dockerMaxCores": 3,"dockerMaxMemory": 512}}' http://localhost:5555/isolated-test
```