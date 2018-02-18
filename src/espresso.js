import Web3 from "web3";
import path from "path";
import fs, { watchFile } from "fs";
import originalrequire from "original-require";
import MochaParallel from "mocha-parallel-tests";

import { Resolver } from "./truffle/external";
import { TestResolver, TestSource, TestRunner } from "./truffle/helpers";
import {
  hideCursor,
  showCursor,
  getAccounts,
  getTestConfig,
  watch,
  parseTestFiles,
  compileContracts,
  performDeploy
} from "./helpers";

const mochaTemplate = function(runner, tests, accounts) {
  before("prepare suite", function(done) {
    runner.initialize(done);
  });

  beforeEach("before test", function(done) {
    runner.startTest(this, done);
  });

  afterEach("after test", function(done) {
    runner.endTest(this, done);
  });

  tests(accounts);
};

export default async function(testPath, watchOption) {
  let config = getTestConfig();
  let mocha = new MochaParallel();
  let web3 = new Web3();
  web3.setProvider(config.provider);
  global.web3 = web3;

  // Set accounts
  let accounts = await getAccounts(web3);
  if (!config.from) {
    config.networks[config.network].from = accounts[0];
  }

  if (!config.resolver) {
    config.resolver = new Resolver(config);
  }

  // Set test files
  let watchFiles = [];
  let files = parseTestFiles(testPath);
  files.forEach(function(file) {
    delete originalrequire.cache[file];
    watchFiles.push(path.join(config.test_directory, file));
  });

  // Set testers
  let testSource = new TestSource(config);
  let testResolver = new TestResolver(
    config.resolver,
    testSource,
    config.contracts_build_directory
  );
  testResolver.cache_on = false;

  // Compile and deploy contracts
  await compileContracts(config, testResolver);
  await performDeploy(config, testResolver);

  // Set test runner.
  let runner = new TestRunner(config);

  // Set add-ons for smart contract testing
  global.artifacts = {
    require: function(import_path) {
      return testResolver.require(import_path);
    }
  };

  global.contract = function(name, tests) {
    MochaParallel.describe("Contract: " + name, function() {
      mochaTemplate.bind(this, runner, tests, accounts)();
    });
  };

  global.contract.only = function(name, tests) {
    MochaParallel.describe.only("Contract: " + name, function() {
      mochaTemplate.bind(this, runner, tests, accounts)();
    });
  };

  // Listen for changes in the test files
  if (watchOption === true) {
    let runAgain = false;
    let runnerStub;

    hideCursor();

    const loadAndRun = () => {
      try {
        // Add each .js file to the mocha instance
        files.forEach(function(file) {
          mocha.addFile(path.join(config.test_directory, file));
        });
        runner = new TestRunner(config);
        runAgain = false;

        runnerStub = mocha.run(() => {
          runnerStub = null;
          if (runAgain) rerun();
        });
      } catch (error) {
        console.log(error.stack);
      }
    };

    const purge = () => {
      watchFiles.forEach(file => {
        delete originalrequire.cache[file];
      });
    };

    const rerun = () => {
      purge();
      mocha.suite = mocha.suite.clone();
      mocha.suite.ctx = new MochaParallel.Context();
      loadAndRun();
    };

    loadAndRun();
    watch(config, watchFiles, () => {
      runAgain = true;
      if (runnerStub) {
        runnerStub.abort();
      } else {
        rerun();
      }
    });

    // User ends the test
    process.on("SIGINT", () => {
      showCursor();
      console.log("\n");
      process.exit(130);
    });
  } else {
    // Run tests only once.
    files.forEach(function(file) {
      mocha.addFile(path.join(config.test_directory, file));
    });
    mocha.run(function(failures) {
      process.on("exit", function() {
        process.exit(failures);
      });
    });
  }

  process.on("unhandledRejection", function(reason, p) {
    throw reason;
  });
}
