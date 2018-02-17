let Mocha = require("mocha");
let MochaParallel = require("mocha-parallel-tests");
let path = require("path");
let fs = require("fs");
var watchFile = require("fs").watchFile;
let Web3 = require("web3");

// Truffle files
let Resolver = require("truffle-resolver");
let Contracts = require("truffle-workflow-compile");
let Migrate = require("truffle-migrate");
let Profiler = require("truffle-compile/profiler.js");

// Local truffle files
let Config = require("./testing/config");
let TestResolver = require("./testing/testresolver");
let TestSource = require("./testing/testsource");
let TestRunner = require("./testing/testrunner");

const getConfig = function() {
  let config = Config.detect({
    workingDirectory: path.resolve("."),
    buildFolder: ".test"
  });

  // if "development" exists, default to using that for testing
  if (!config.network && config.networks.development) {
    config.network = "development";
  }

  if (!config.network) {
    config.network = "test";
  }

  return config;
};

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

const compileContracts = function(config, test_resolver) {
  return new Promise(function(resolve, reject) {
    Profiler.updated(
      config.with({
        resolver: test_resolver
      }),
      function(err, updated) {
        if (err) return reject(err);

        updated = updated || [];

        // Compile project contracts and test contracts
        Contracts.compile(
          config.with({
            all: config.compileAll === true,
            files: updated,
            resolver: test_resolver,
            quiet: false,
            quietWrite: true
          }),
          function(err, abstractions, paths) {
            if (err) return reject(err);
            resolve(paths);
          }
        );
      }
    );
  });
};

const run = async function() {
  let config = getConfig();

  let web3 = new Web3();

  web3.setProvider(config.provider);

  let mocha = new MochaParallel();
  // mocha.setOwnOptions({ maxParallel: 1 });
  //let mocha = new Mocha();
  console.log("Mocha", mocha.options);

  // Add each .js file to the mocha instance
  // To be used for watching files.
  let files = fs.readdirSync(config.test_directory).filter(function(file) {
    // Only keep the .js files
    return file.substr(-3) === ".js";
  });

  files.forEach(function(file) {
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

  let testSource = new TestSource(config);

  let testResolver = new TestResolver(
    config.resolver,
    testSource,
    config.contracts_build_directory
  );
  testResolver.cache_on = false;

  console.log(config.contracts_build_directory);

  const paths = await compileContracts(config, testResolver);

  let runner = new TestRunner(config);

  global.web3 = web3;
  global.artifacts = {
    require: function(import_path) {
      return testResolver.require(import_path);
    }
  };

  global.contract = function(name, tests) {
    Mocha.describe("Contract: " + name, function() {
      mochaTemplate.bind(this, runner, tests, accounts)();
    });
  };

  global.parallel = function(name, tests) {
    parallelTest(name, tests);
  };

  // Run the tests.
  mocha.run(function(failures) {
    process.on("exit", function() {
      process.exit(failures); // exit with non-zero status if there were failures
    });
  });
};

const watch = async function(files) {
  var options = { interval: 100 };
  file = files[0];
  watchFile(file, options, function(curr, prev) {
    if (prev.mtime < curr.mtime) {
      console.log("CHANGE");
    }
  });
};

module.exports = { run: run, watch: watch };
