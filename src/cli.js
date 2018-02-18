#!/usr/bin/env node

import program from "commander";
import Espresso from "./espresso";
import MiniReporter from "./reporters/mini";

let testPath = "./test";
let reporter = "";

program
  .arguments("[path]")
  .option("-w, --watch", "Watch tests")
  .option("-v, --verbose", "Verbose tests")
  .option("-f, --fun", "Fun tests")
  .action(function(path) {
    testPath = path;
  })
  .parse(process.argv);

if (program.verbose) {
  reporter = "mocha-better-spec-reporter";
} else if (program.fun) {
  reporter = "nyan";
} else {
  reporter = "spec";
}

const instance = new Espresso({
  testPath,
  watch: program.watch,
  reporter: reporter
});

global = Object.assign(global, instance.globalScope);

instance.run();
