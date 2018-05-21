#!/usr/bin/env node

import program from "commander";
import Espresso from "./index";
import MiniReporter from "./reporters/mini";

let testPath = "test/";
let reporter = "";

program
  .arguments("[path]")
  .option("-w, --watch", "Watch tests")
  .option("-v, --verbose", "Verbose tests")
  .option("-f, --fun", "Fun tests")
  .option("-p, --port [port]", "Port number to launch test RPC on")
  .action(function(path) {
    testPath = path;
  })
  .parse(process.argv);

if (program.watch) {
  reporter = MiniReporter;
} else if (program.verbose) {
  reporter = "mocha-better-spec-reporter";
} else if (program.fun) {
  reporter = "nyan";
} else {
  reporter = "spec";
}

const instance = new Espresso({
  testPath,
  reporter,
  port: program.port,
  watch: program.watch
});

global = Object.assign(global, instance.globalScope);

instance.run();
