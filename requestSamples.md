### Примеры запросов:
Тип - POST , header content-type - application-json .
Тело:
 ```
 {
 "code": ""#include <iostream>\n #include <cstdlib> \nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}"",
 "language":"cpp",
 "testCases":["std1","std2"]
 }
 
 ```
 Не забываем слать запросы на правильный порт и путь:
 ```
 http://localhost:3351/isolatedTest
 ```

##Пример запроса курлом
```
 curl -H "Content-Type: application/json" -X POST -d '{"code": ""#include <iostream>\n #include <cstdlib> \nusing namespace std;\n int main() {string greeting;\n cin >> greeting;\n cout << 11111 << greeting << endl;\n return 0;}"","language":"cpp","testCases":["std1","std2"]}' http://localhost:5555/isolatedTest
```