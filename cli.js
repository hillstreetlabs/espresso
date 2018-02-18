#!/usr/bin/env node

require("babel-core/register");
require("babel-polyfill");

let program = require("commander");
let espresso = require("./lib");

let testPath = "./test";

program.arguments("[path]").action(function(path) {
  testPath = path;
});

program.parse(process.argv);

espresso.run(testPath);
