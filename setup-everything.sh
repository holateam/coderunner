#!/bin/bash
git clone https://github.com/holateam/coderunner.git
cd ./coderunner/docker/cpp
./runme
cd ../../node
npm install
node server.js
