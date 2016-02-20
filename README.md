<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
  <style>
    h1, h2{
      color: blue;
    }
  </style>
</head>
<body>
<h1>CodeRunner</h1>
CodeRunner is an open-source project, that allows people to compile and test their code at the remote server.
All you need is to request server to compile your code (or not to compile, if you have interpretive code) and run program throught a variety of user-defined test cases. Generally, your request will lok like:
> Hello, CodeRunner!<br>
>I'm John and I want you to test my C++ code<br>
>Here is some code to test<br>
>And here are some test cases i prepared previously

<h2>Destination</h2>
Designed for creation programming leaning resources like the Codewars, Hacker Rank, etc.
Allow compile and safety run user's program code with pack of test cases without any risk of working ability own server.

<h2>Used technology</h2>
Service based on fully autonomous running of each test-case in separated container,
which realized with powerful virtual machine technology "Docker".

<h2>Test cases</h2>
User can send some test cases for checking quality of testing program code.
Code must read incoming values by using StdIn interface and print results of calculation to the standard StdOut.
Output streams of StdErr, StdOut and timestamp will written to the answer object separately for each test case.

<h2>Safety</h2>
User's code pass some inspections before running.
Prohibited words for each programming language describes in CONF-file of this service and can be modified.
Each test case limited in time of running and size of StdOut & StdErr streams.
Also every request sender pass the white list checking, password checking and have some frequency limits.

<h2>Virtual machine parameters</h2>
Service have default parameters for running containers like RAM size, processor count, lifetime limits and other.
But each query can modify standard parameters for special needs depending to the testing code.

<h2>Incoming request and output API answer</h2>
Incoming request object must contain SERIALIZED program code for running.
Full parameters of incoming request:
<a href="https://github.com/holateam/coderunner/blob/master/requestSamples.md">Query examples</a>
<h3>Output API answer</h3>
Output object from API-servicev looks like this:
<a href="https://github.com/holateam/coderunner/blob/master/outputObject.md">Answer examples</a>
It contain common http-answer code and body object, that describe
container running errors, compile errors and results of test case running.


</body>
</html>
