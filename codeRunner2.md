CodeRunner service 
------------------

### Node.js server

Постоянно работающий сервер, написанный на языке Javascript, запускается интерпритатором Node. Организован как системный сервис (можно использовать пакет forever-service).
Модуль отвечает за прием и обработку REST запросов на тестирование пользовательского кода.

Полученные запросы валидируются сервером и отправляются в сервер архива запросов.

Сервер должен взаимодействать с внешним сервером логирования и рассылки.
Все входящие запросы, все подозрительные секции, найденные в коде, все внутренние системные ошибки должны логироватся на удаленном сервере. Некоторые, особо критичные случаи должны быть отправлены с флагом ```broadcast``` для рассылки почтовых уведомлений администраторам.
Отвалидированный  код отправляется обработчику очереди запуска задач.

Очередь запуска задач представляет собой отедльный модуль на языке Node.js. Делает следующие действия: при поступлении задачи на вход, она проверяет возможность отправки её на менеджер запуска docker контейнеров. В случае, если количество запущенных скриптов максимально заданной конфигурацией, очередь оставляет задачу в памяти, лжидая момента, когда поступит комманда на освобождение места в очереди.

Сервер принимает следующие запросы:
***
**Запрос на проведение тестирования**
```
	Метод : POST
	Путь : /isolatedTest
	Тело : 
	{
		code: “”,
		language: “”,
		testCases: [ “stdIn 1”, “stdIn 2” ]
	}
```
**Формат ответа на запрос**
```
	Код ответа : 200 (запрос принят) / 400 (запрос отклоняется из за переполнения очереди)
	Тело : 
	{
		dockerError: "",
		compilerErrors: "",
		stdout : [ “testcase1 otp”, “testcase2 otp” ],
		stderr : [ “testcase1 err”, “testcase2 err” ],
		timestamps : [ “testcase1 duration”, “testcase2 duration” ]
	}
```
***
**Запрос на обработку результатов тестирования**
*Будет сформирован и отправлен ответ на запрос тестирования* из скрипта запуска Docker'a после завершения работы контейнера.
```
	Метод : GET
	Путь : /analyseTest/:<sessionID>
```
**Формат ответа на запрос**
```
	Код ответа : 200
	Тело : { data : null }
```

###Работа очереди запуска задач

**Запрос на проведение тестирования**
Очередь принимает на вход объект задачи, содержащий следующие свойства:
```
{
	sessionId: {
				code: “”,
				language: “”,
				testCases: [ “stdIn 1”, “stdIn 2” ]
				}
}
```
и функцию [, callback].

Очередь проверяет привышение лимита параллельно запущенных контейнеров и если лимит привышен - складывает полученный объект в массив.
Если лимит не превышен - очередь передает менеджеру запуска контейнеров полученный объект:
```
{
	sessionId: {
				code: “”,
				language: “”,
				testCases: [ “stdIn 1”, “stdIn 2” ]
				}
}
```
вместе со своей функицией [, callback].
По [, callback] очередь ожидает от менеджера запуска контейнеров объект с результатом выполнения исходного кода:

```
{
		dockerError: "",
		compiler errors: "",
		stdout : [ “testcase1 otp”, “testcase2 otp” ],
		stderr : [ “testcase1 err”, “testcase2 err” ],
		timestamps : [ “testcase1 duration”, “testcase2 duration” ]
}
```
и передает этот объект серверу выше. 

###Менеджер запуска докер-контейнеров.

Данный модуль получает в качестве входных параметров объект, имеющий следующую структуру:
```
{
  sessionId: {
  code: “”,
  language: “”,
  testCases: [ “stdIn 1”, “stdIn 2” ]
  }
}
```
и колл-бек функцию callback.

Но основании параметра language он выбирает требуемый для запуска докера образ, формирует структуру папок следующего вида:
* общая докер-папка / sessionId / input
* общая докер-папка / sessionId / output

В папку input генерирует файл code и файл testcases

Далее менеджер вызывает команду загрузки докер-контейнера и выполнения стартового bash-скрипта примерно такого вида:

```
var cp = require('child_process');
cp.exec('docker run -d --net none -v имяОбщейПапки: имяОбщейПапки ' + имяКонтейнера + 'start' + sessionId, callbackFunction);
```
Дополнительно требуется найти и прописать параметры, регулирующие количествопамяти для процесса, степень макс. загрузки процессора и т.д.
Колл-бек функция, вызываемая при завершении, дожна проверить код завершения работы докера.
Если процесс докера завершился крашем – сформировать объект ответа с сообщением об ошибке.
```
{
   dockerError: “docker crashed”,	
   compiler errors: "", 
   stdout : [ “testcase1 otp”, “testcase2 otp” ],
   stderr : [ “testcase1 err”, “testcase2 err” ],
   timestamps : [ “testcase1 duration”, “testcase2 duration” ]
 }
```
Иначе запустить анализатор логов и сформировать в памяти объект ответа c результатми исполнения тесткейсов. Сразу после старта процесса с докером требуется запустить отложенную на № секунд (из конф-файла) функцию, которая должна проверить, завершился ли уже процесс докера. Если да – то ок, пишем в лог и выходим, если нет – отдаём команду kill процессу докера и тоже пишем в лог. Объект ответа в этом случае содержит информацию только о том, что процесс превысил допустимое время выполнения: 
```
 {
   dockerError: “docker killed”
   compiler errors: "",
   stdout : [ “testcase1 otp”, “testcase2 otp” ],
   stderr : [ “testcase1 err”, “testcase2 err” ],
   timestamps: [ “testcase1 duration”, “testcase2 duration” ]
 }
```
Перед завершением работы менеджера - удалить временные каталоги и файлы по следующим путям: общая докер-папка / sessionId / input общая докер-папка / sessionId /output
По завершении вызываем колл-бек функцию callback, полученную во вxодных параметрах, и передаём ей sessionId завершённой задачи и сформированный объект ответа:
```callback(sessionId, объект_ответа);```


###Докер-контейнер

Принимает на вход имя bash-скрипта, для выполнения внутри, и taskId вторым параметром. Bash-скрипт переходит в папку с именем taskId и запускает в ней компиляцию файла с исходным кодом пользователя. Процесс компиляции логируется в файле  в папке output с именем logCompile. В случае успешной компиляции, производится запуск откомпелированного файла, с передаче ему через pipe файла с тесткейсом. Результат работы каждого тесткейса сохраняется в папке output в файле testCaseLog. Дополнительно докер-контейнер должен контролировать обьем выгруженных в std-out данных, что бы исключить переполнение.

###Завершающий этап обработки текущей задачи

Сервер Node при получении GET запроса, сообщающего, что докер завершил работу контейнера, отправляет комманду очереди на освобождение одногом места, и запускает модуль анализатора логов. После обработки, анализатор логов формирует в памяти обьект ответа. По завершению проивзодим отправку результата на искходный response.

###Анализатор логов

Проивзодит чтение лог файлов отработавшего докер-контейнера из поддиректории taskId/output и формирует на выходе ответ:
```
	{
		dockerError : "",
		compiler errors : "",
		stdout : [ “testcase1 otp”, “testcase2 otp” ],
		stderr : [ “testcase1 err”, “testcase2 err” ],
		timestamps : [ “testcase1 duration”, “testcase2 duration” ]
	}
```

###Конфиг-файл сервера

* Размер очереди;
* Количество одновременно запущенных докер-контейнеров;
* Количество секунд timeout, через которые докер должен завершиться;
* Макс количество входящих запросов в минуту;
* Макс количество строк кода;
* Перечень email-адрессов для отправки alarm;

###Общее положение

Сервер должен ограничивать количество запросов на компиляцию для каждого пользователя.
Запросы принимаются исключительно от доверенных серверов. Остальные -- игнорируются.

После приема и подтверждения запроса выполняются следующие действия:
- Генерирование случайного идентификатора ```sessionId``` для сессии тестирования.
- Санитаризация входящего кода.
- Подготовка общей директории для виртуальной машины и хоста ```~/.coderunner/sessionId```.
- Создание в директории ```~/.coderunner/sessionId/input``` файлов ```source.x``` с исходным кодом, где x - соотествующее языку програмирования расширение и ```testcases```, который стостоит из строк входных данных для последоватлеьного тестирования.


### Модуль санитаризации кода

Клас со статическим методом, который принимает параметром объект с кодом и маркер языка.

```
{
		code: “”,
		language: “”
	}
```
Результат работы метода -- список обнаруженных нарушений в коде в виде массива:
```
[
	{
		line: 0, 			(номер линии с нарушением)
		danger-level: 0, 	(уровень опасности, чем выше -- тем хуже)
		text: "",			(строка с нарушением)
		comment: ""			(описание обнаруженного нарушения)
	}, ... {}
]
```

### Сервер логирования и рассылки

Сервер отвечает за логирование (записать в базу) приходящие на него месседжы, и отправлять на зарезервированные адреса письма, при необходимости. Необходимость определяется специальным флагом запроса к серверу.

Сервер принимает запросы:

***
**Запрос на логирование**
```
	Метод : POST
	Путь : /log
	Тело : {
		user : "",
		type : info / warning / error / breach,
		broadcast : true / false
	}
```
**Формат ответа на запрос**
```
	Код ответа : 200 (если сервер принял и обработал запрос) / 400 (если возникли ошибки и сообщение не сохранено в базу)
```
***

### install.sh

Скрипт развертки приложения CodeRunner.
Скрипт должен удостоверить наличие на сервере необходимых пакетов (```which```), и в случае их отсутствия: установить.
Необходимые пакеты: node, npm, forever, forever-service, остальные модули, curl, docker, файлы node сервера (храним на GitHub), образы Docker контейнеров.

### Внутренние Bash скрипты для Docker

```сompiler.sh```
input: файл с кодом пользователя (с валидным расширением)
output: комманда для выполнения

```tester.sh```
input: файл с тесткейсами, комманда для выполнения
output: файлы с результатами тестирования


###Структура взаимодействия между сервером Node и очередью задач.

Взаимодействие с очередью производится двумя методами ```addTask``` и ```finishTask```. 

Метод ```addTask``` принимает в качестве входного параметра объект такой структуры:
```
{
		taskId:"",
		code: “”,
		language: “”,
		testCases: [ “stdIn 1”, “stdIn 2” ]
	}
```
 
 Метод ```finishTask``` принимает в качестве входного параметра объект такой структуры:
 ```
 {
		taskId:""
	
	}
 ```