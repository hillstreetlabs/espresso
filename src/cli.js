#!/usr/bin/env node

import program from "commander";
import espresso from "./espresso";

let testPath = "./test";

program.arguments("[path]").action(function(path) {
  testPath = path;
});

program.parse(process.argv);

espresso(testPath);

