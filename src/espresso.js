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
  getConfig,
  watch
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
  let config = getConfig();

  let web3 = new Web3();

  web3.setProvider(config.provider);

  let mocha = new MochaParallel();
  let watchFiles = [];
  let files = [];

  const stats = fs.lstatSync(testPath);
  if (stats.isFile() && testPath.substr(-3) === ".js") {
    files = [path.resolve(testPath)];
  } else if (stats.isDirectory()) {
    files = fs.readdirSync(path.resolve(testPath)).filter(function(file) {
      // Only keep the .js files
      return file.substr(-3) === ".js";
    });
  }

  files.forEach(function(file) {
    delete originalrequire.cache[file];
    watchFiles.push(path.join(config.test_directory, file));
  });

  // Set accounts
  let accounts = await getAccounts(web3);
  if (!config.from) {
    config.networks[config.network].from = accounts[0];
  }

  // from truffle test.js
  if (!config.resolver) {
    config.resolver = new Resolver(config);
  }

  let testSource = new TestSource(config);

  let testResolver = new TestResolver(
    config.resolver,
    testSource,
    config.contracts_build_directory
  );
  testResolver.cache_on = false;

  let dependencyPaths = await compileContracts(config, testResolver);

  let runner = new TestRunner(config);

  await performDeploy(config, testResolver);

  global.web3 = web3;
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

  process.on("unhandledRejection", function(reason, p) {
    throw reason;
  });

  if (watchOption === true) {
    hideCursor();
    process.on("SIGINT", () => {
      showCursor();
      console.log("\n");
      process.exit(130);
    });

    let runAgain = false;
    let runnerStub;

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
          if (runAgain) {
            rerun();
          }
        });
      } catch (e) {
        console.log(e.stack);
      }
    };

    const purge = () => {
      watchFiles.forEach(file => {
        delete originalrequire.cache[file];
      });
    };

    loadAndRun();

    const rerun = () => {
      purge();
      mocha.suite = mocha.suite.clone();
      mocha.suite.ctx = new MochaParallel.Context();
      loadAndRun();
    };

    watch(config, watchFiles, () => {
      console.log("Change detected");
      runAgain = true;
      if (runnerStub) {
        runnerStub.abort();
      } else {
        rerun();
      }
    });
  } else {
    files.forEach(function(file) {
      mocha.addFile(path.join(config.test_directory, file));
    });
    // Run the tests.
    mocha.run(function(failures) {
      process.on("exit", function() {
        process.exit(failures); // exit with non-zero status if there were failures
      });
    });
  }
}
