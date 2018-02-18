"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const template = exports.template = (runner, tests, accounts) => {
  before("prepare suite", function (done) {
    runner.initialize(done);
  });

  beforeEach("before test", function (done) {
    runner.startTest(this, done);
  });

  afterEach("after test", function (done) {
    runner.endTest(this, done);
  });

  tests(accounts);
};