let Mocha = require("mocha");
let path = require("path");
let fs = require("fs");
let Web3 = require("web3");

// Truffle files
let Config = require("truffle-config");
let Resolver = require("truffle-resolver");
let Contracts = require("truffle-workflow-compile");
let Migrate = require("truffle-migrate");

// Local truffle files
let TestResolver = require("./testing/testresolver");
let TestSource = require("./testing/testsource");
let TestRunner = require("./testing/testrunner");

const getAccounts = function(web3) {
  return new Promise(function(resolve, reject) {
    web3.eth.getAccounts(function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const run = async function() {
  let config = Config.detect({ workingDirectory: path.resolve(".") });

  // if "development" exists, default to using that for testing
  if (!config.network && config.networks.development) {
    config.network = "development";
  }

  if (!config.network) {
    config.network = "test";
  }

  let web3 = new Web3();
  web3.setProvider(config.provider);

  let mocha = new Mocha();

  // Add each .js file to the mocha instance
  fs
    .readdirSync(config.test_directory)
    .filter(function(file) {
      // Only keep the .js files
      return file.substr(-3) === ".js";
    })
    .forEach(function(file) {
      mocha.addFile(path.join(config.test_directory, file));
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

  let test_source = new TestSource(config);
  test_resolver = new TestResolver(
    config.resolver,
    test_source,
    config.contracts_build_directory
  );
  test_resolver.cache_on = false;

  let runner = new TestRunner(config);

  global.web3 = web3;
  global.artifacts = {
    require: function(import_path) {
      return test_resolver.require(import_path);
    }
  };

  let template = function(tests) {
    this.timeout(runner.TEST_TIMEOUT);

    before("prepare suite", function(done) {
      this.timeout(runner.BEFORE_TIMEOUT);
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

  global.contract = function(name, tests) {
    Mocha.describe("Contract: " + name, function() {
      template.bind(this, tests)();
    });
  };

  // Run the tests.
  mocha.run(function(failures) {
    process.on("exit", function() {
      process.exit(failures); // exit with non-zero status if there were failures
    });
  });
};

module.exports = { run: run };
