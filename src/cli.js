#!/usr/bin/env node

import program from "commander";
import Espresso from "./espresso";

let testPath = "./test";

program
  .arguments("[path]")
  .option("-w, --watch", "Watch tests")
  .action(function(path) {
    testPath = path;
  });

program.parse(process.argv);

const instance = new Espresso({
  testPath,
  watch: program.watch
});

global = Object.assign(global, instance.globalScope);

instance.run();
