#!/bin/bash
cd docker/cpp
./runme
cd ../../node
npm install
node server.js
