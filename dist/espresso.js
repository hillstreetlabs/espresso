"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _getOwnPropertyDescriptor = require("babel-runtime/core-js/object/get-own-property-descriptor");

var _getOwnPropertyDescriptor2 = _interopRequireDefault(_getOwnPropertyDescriptor);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _desc, _value, _class;

var _web = require("web3");

var _web2 = _interopRequireDefault(_web);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _mobx = require("mobx");

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _originalRequire = require("original-require");

var _originalRequire2 = _interopRequireDefault(_originalRequire);

var _mochaParallelTests = require("mocha-parallel-tests");

var _mochaParallelTests2 = _interopRequireDefault(_mochaParallelTests);

var _mocha = require("mocha");

var _mocha2 = _interopRequireDefault(_mocha);

var _server = require("./server");

var _server2 = _interopRequireDefault(_server);

var _mocha3 = require("./mocha");

var _cursor = require("./cursor");

var _files = require("./files");

var _external = require("./truffle/external");

var _helpers = require("./truffle/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

let Espresso = (_class = class Espresso {
  constructor(options = {}) {
    this.testPath = options.testPath || ".";
    this.watch = options.watch;
    this.reporter = options.reporter;
    this.server = new _server2.default();
    this.mocha = new _mochaParallelTests2.default();
    //this.mocha = new Mocha();
  }

  get config() {
    let _config = new _helpers.Config();
    try {
      _config = _helpers.Config.detect({ workingDirectory: _path2.default.resolve(".") });
    } catch (err) {
      console.log("Error", err);
    }
    _config.workingDirectory = _path2.default.resolve(".");
    _config.buildFolder = ".test";
    _config.resolver = _config.resolver || this.resolver;
    let networks = _config.networks || {};
    _config.networks = (0, _assign2.default)(networks, {
      test: {
        host: "localhost",
        port: 8545,
        network_id: "*",
        from: this.server.accounts[0],
        provider: this.server.provider
      }
    });
    _config.network = "test";
    _config.artifactor = new _external.Artifactor(_config.contracts_build_directory);
    return _config;
  }

  get testFiles() {
    let files = [];
    const stats = _fs2.default.lstatSync(this.testPath);
    if (stats.isFile() && this.testPath.substr(-3) === ".js") {
      files = [_path2.default.resolve(this.testPath)];
    } else if (stats.isDirectory()) {
      const temp = _fs2.default.readdirSync(_path2.default.resolve(this.testPath)).filter(file => {
        return file.substr(-3) === ".js";
      });
      temp.forEach(file => {
        files.push(_path2.default.join(this.testPath, file));
      });
    }
    return files;
  }

  get globalScope() {
    let scope = {};
    // Set add-ons for smart contract testing
    scope.artifacts = {
      require: import_path => {
        return this.testResolver.require(import_path);
      }
    };

    scope.contract = (name, tests) => {
      _mochaParallelTests2.default.describe("Contract: " + name, () => {
        _mocha3.template.bind(this, this.testRunner, tests, this.server.accounts)();
      });
    };

    scope.contract.only = (name, tests) => {
      _mochaParallelTests2.default.describe.only("Contract: " + name, () => {
        _mocha3.template.bind(this, this.testRunner, tests, this.server.accounts)();
      });
    };

    scope.assert = _chai2.default.assert;

    scope.web3 = this.server.web3;

    return scope;
  }

  async run() {
    await this.server.start();

    this.resolver = new _external.Resolver(this.config);
    this.testSource = new _helpers.TestSource(this.config);
    this.testResolver = new _helpers.TestResolver(this.resolver, this.testSource, this.config.contracts_build_directory);
    this.testResolver.cache_on = false;

    // Set test files
    let watchFiles = [];
    this.testFiles.forEach(file => {
      delete _originalRequire2.default.cache[file];
      watchFiles.push(file);
    });

    // Compile and deploy contracts
    let testConfig = this.config.with({ resolver: this.testResolver });
    let smartContracts = await this.server.compile(testConfig);
    let migrations = await this.server.migrate(testConfig);
    console.log("Compiled and migrated!");

    // Set test runner.
    this.testRunner = new _helpers.TestRunner(this.config);

    // Listen for changes in the test files
    if (this.watch === true) {
      let runAgain = false;
      let runnerStub;

      (0, _cursor.hideCursor)();

      const loadAndRun = () => {
        try {
          // Add each .js file to the mocha instance
          this.testFiles.forEach(file => {
            this.mocha.addFile(file);
          });
          this.testRunner = new _helpers.TestRunner(this.config);
          runAgain = false;
          runnerStub = this.mocha.reporter(this.reporter).run(() => {
            runnerStub = null;
            if (runAgain) rerun();
          });
        } catch (error) {
          console.log(error.stack);
        }
      };

      const purge = () => {
        watchFiles.forEach(file => {
          delete _originalRequire2.default.cache[file];
        });
      };

      const rerun = () => {
        purge();
        this.mocha.suite = this.mocha.suite.clone();
        this.mocha.suite.ctx = new _mochaParallelTests2.default.Context();
        loadAndRun();
      };

      loadAndRun();
      (0, _files.watch)(this.config, watchFiles, async () => {
        runAgain = true;
        if (runnerStub) {
          runnerStub.abort();
          this.server.close();
        } else {
          rerun();
        }
      });

      (0, _files.watch)(this.config, smartContracts, async () => {
        runAgain = true;
        if (runnerStub) {
          runnerStub.abort();
          this.server.close();
        } else {
          // Compile and deploy contracts
          let smartContracts = await this.server.compile(this.config.with({ resolver: this.testResolver }));
          await this.server.migrate(this.config.with({ resolver: this.testResolver }));
          rerun();
        }
      });

      // User ends the test
      process.on("SIGINT", () => {
        (0, _cursor.showCursor)();
        this.server.close();
        console.log("\n");
        process.exit(130);
      });
    } else {
      // Run tests only once.
      this.testFiles.forEach(file => {
        this.mocha.addFile(file);
      });
      this.mocha.reporter(this.reporter).run(failures => {
        process.on("exit", () => {
          process.exit(failures);
        });
        this.server.close();
      });
    }

    process.on("unhandledRejection", (reason, p) => {
      throw reason;
    });
  }
}, (_applyDecoratedDescriptor(_class.prototype, "config", [_mobx.computed], (0, _getOwnPropertyDescriptor2.default)(_class.prototype, "config"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "testFiles", [_mobx.computed], (0, _getOwnPropertyDescriptor2.default)(_class.prototype, "testFiles"), _class.prototype), _applyDecoratedDescriptor(_class.prototype, "globalScope", [_mobx.computed], (0, _getOwnPropertyDescriptor2.default)(_class.prototype, "globalScope"), _class.prototype)), _class);
exports.default = Espresso;