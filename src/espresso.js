import Web3 from "web3";
import path from "path";
import fs, { watchFile } from "fs";
import { computed } from "mobx";
import chai from "chai";
import originalrequire from "original-require";
import MochaParallel from "mocha-parallel-tests";
import Mocha from "mocha";
import Server from "./server";
import { template } from "./mocha";
import { hideCursor, showCursor } from "./cursor";
import { watch } from "./files";

import { Resolver, Artifactor } from "./truffle/external";
import {
  Config,
  TestResolver,
  TestSource,
  TestRunner
} from "./truffle/helpers";

export default class Espresso {
  constructor(options = {}) {
    this.testPath = options.testPath || ".";
    this.watch = options.watch;
    this.reporter = options.reporter;
    this.server = new Server();
    // this.mocha = new MochaParallel();
    this.mocha = new Mocha();
  }

  @computed
  get config() {
    let _config = new Config();
    try {
      _config = Config.detect({ workingDirectory: path.resolve(".") });
    } catch (err) {
      console.log("Error", err);
    }
    _config.workingDirectory = path.resolve(".");
    _config.buildFolder = ".test";
    _config.resolver = _config.resolver || this.resolver;
    let networks = _config.networks || {};
    _config.networks = Object.assign(networks, {
      test: {
        host: "localhost",
        port: 8545,
        network_id: "*",
        from: this.server.accounts[0],
        provider: this.server.provider
      }
    });
    _config.network = "test";
    _config.artifactor = new Artifactor(_config.contracts_build_directory);
    return _config;
  }

  @computed
  get testFiles() {
    let files = [];
    const stats = fs.lstatSync(this.testPath);
    if (stats.isFile() && this.testPath.substr(-3) === ".js") {
      files = [path.resolve(this.testPath)];
    } else if (stats.isDirectory()) {
      const temp = fs.readdirSync(path.resolve(this.testPath)).filter(file => {
        return file.substr(-3) === ".js";
      });
      temp.forEach(file => {
        files.push(path.join(this.testPath, file));
      });
    }
    return files;
  }

  @computed
  get globalScope() {
    let scope = {};
    // Set add-ons for smart contract testing
    scope.artifacts = {
      require: import_path => {
        return this.testResolver.require(import_path);
      }
    };

    scope.contract = (name, tests) => {
      MochaParallel.describe("Contract: " + name, () => {
        template.bind(this, this.testRunner, tests, this.server.accounts)();
      });
    };

    scope.contract.only = (name, tests) => {
      MochaParallel.describe.only("Contract: " + name, () => {
        template.bind(this, this.testRunner, tests, this.server.accounts)();
      });
    };

    scope.assert = chai.assert;

    scope.web3 = this.server.web3;

    return scope;
  }

  async run() {
    await this.server.start();

    this.resolver = new Resolver(this.config);
    this.testSource = new TestSource(this.config);
    this.testResolver = new TestResolver(
      this.resolver,
      this.testSource,
      this.config.contracts_build_directory
    );
    this.testResolver.cache_on = false;

    // Set test files
    let watchFiles = [];
    this.testFiles.forEach(file => {
      delete originalrequire.cache[file];
      watchFiles.push(file);
    });

    // Compile and deploy contracts
    let testConfig = this.config.with({ resolver: this.testResolver });
    let smartContracts = await this.server.compile(testConfig);
    let migrations = await this.server.migrate(testConfig);
    console.log("Compiled and migrated!");

    // Set test runner.
    this.testRunner = new TestRunner(this.config);

    // Listen for changes in the test files
    if (this.watch === true) {
      let runAgain = false;
      let runnerStub;

      hideCursor();

      const loadAndRun = () => {
        try {
          // Add each .js file to the mocha instance
          this.testFiles.forEach(file => {
            this.mocha.addFile(file);
          });
          this.testRunner = new TestRunner(this.config);
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
          delete originalrequire.cache[file];
        });
      };

      const rerun = () => {
        purge();
        this.mocha.suite = this.mocha.suite.clone();
        this.mocha.suite.ctx = new MochaParallel.Context();
        loadAndRun();
      };

      loadAndRun();
      watch(this.config, watchFiles, async () => {
        runAgain = true;
        if (runnerStub) {
          runnerStub.abort();
          this.server.close();
        } else {
          rerun();
        }
      });

      watch(this.config, smartContracts, async () => {
        runAgain = true;
        if (runnerStub) {
          runnerStub.abort();
          this.server.close();
        } else {
          // Compile and deploy contracts
          let smartContracts = await this.server.compile(
            this.config.with({ resolver: this.testResolver })
          );
          await this.server.migrate(
            this.config.with({ resolver: this.testResolver })
          );
          rerun();
        }
      });

      // User ends the test
      process.on("SIGINT", () => {
        showCursor();
        this.server.close();
        console.log("\n");
        process.exit(130);
      });
    } else {
      // Run tests only once.
      this.testFiles.forEach(file => {
        this.mocha.addFile(file);
      });
      this.mocha.run(failures => {
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
}
