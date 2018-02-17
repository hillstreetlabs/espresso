#!/usr/bin/env node

let program = require("commander");
let espresso = require("./lib");

let testPath = ".";

program.arguments("[path]").action(function(path) {
  testPath = path;
});

program.parse(process.argv);

espresso.run();

// espresso.watch();
