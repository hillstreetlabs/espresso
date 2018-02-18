#!/usr/bin/env node

import program from "commander";
import espresso from "./espresso";

let testPath = "./test";

program
  .arguments("[path]")
  .option("-w, --watch", "Watch tests")
  .action(function(path) {
    testPath = path;
  });

program.parse(process.argv);

console.log(program.watch);

espresso(testPath, program.watch);
