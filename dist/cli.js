#!/usr/bin/env node
"use strict";

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _commander = require("commander");

var _commander2 = _interopRequireDefault(_commander);

var _espresso = require("./espresso");

var _espresso2 = _interopRequireDefault(_espresso);

var _mini = require("./reporters/mini");

var _mini2 = _interopRequireDefault(_mini);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let testPath = "./test";
let reporter = "";

_commander2.default.arguments("[path]").option("-w, --watch", "Watch tests").option("-v, --verbose", "Verbose tests").option("-f, --fun", "Fun tests").action(function (path) {
  testPath = path;
}).parse(process.argv);

if (_commander2.default.verbose) {
  reporter = "mocha-better-spec-reporter";
} else if (_commander2.default.fun) {
  reporter = "nyan";
} else {
  reporter = "spec";
}

const instance = new _espresso2.default({
  testPath,
  watch: _commander2.default.watch,
  reporter: reporter
});

global = (0, _assign2.default)(global, instance.globalScope);

instance.run();