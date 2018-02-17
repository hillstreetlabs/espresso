#!/usr/bin/env node

let program = require("commander");
let test = require("./lib");

let testPath = ".";

program.arguments("[path]").action(function(path) {
  testPath = path;
});

program.parse(process.argv);

console.log("Hey, let's run some tests here: " + testPath);
test.run();

