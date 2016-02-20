# CodeRunner
CodeRunner is an open-source project, that allows people to compile and test their code at the remote server.
All you need is to request server to compile your code (or not to compile, if you have interpretive code) and run program throught a variety of user-defined test cases. Generally, your request will lok like:
```
>Hello, CodeRunner!
>I'm John and I want you to test my C++ code
>Here is some code to test
>And here are some test cases i prepared previously
```

## Destination
Designed for creation programming leaning resources like the Codewars, Hacker Rank, etc.
Allow compile and safety run user's program code with pack of test cases without any risk of working ability own server.

## Used technology
Service based on fully autonomous running of each test-case in separated container,
which realized with powerful virtual machine technology "Docker".

## Test cases
User can send some test cases for checking quality of testing program code.
Code must read incoming values by using StdIn interface and print results of calculation to the standard StdOut.
Output streams of StdErr, StdOut and timestamp will written to the answer object separately for each test case.

## Safety
User's code pass some inspections before running.
Prohibited words for each programming language describes in CONF-file of this service and can be modified.
Each test case limited in time of running and size of StdOut & StdErr streams.
Also every request sender pass the white list checking, password checking and have some frequency limits.

## Virtual machine parameters
Service have default parameters for running containers like RAM size, processor count, lifetime limits and other.
But each query can modify standard parameters for special needs depending to the testing code.

## Incoming request and output API answer
Incoming request object must contain SERIALIZED program code for running.

Full parameters of incoming request:
[Query example]

### Output API answer
Output object from API-servicev looks like this: [Answer example].
It contain common http-answer code and body object, that describe
container running errors, compile errors and results of test case running.


[Query example]: <https://github.com/holateam/coderunner/blob/master/requestSamples.md>
[Answer example]: <https://github.com/holateam/coderunner/blob/master/outputObject.md>
