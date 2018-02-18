"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _ganacheCore = require("ganache-core");

var _ganacheCore2 = _interopRequireDefault(_ganacheCore);

var _web = require("web3");

var _web2 = _interopRequireDefault(_web);

var _external = require("./truffle/external");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Server = class Server {
  constructor() {
    this.ganache = _ganacheCore2.default.server({
      default_balance_ether: 1000
    });
    this.web3 = new _web2.default();
    this.accounts = [];
  }

  async start() {
    await this.ganache.listen(8545, (err, chain) => {
      if (err) {
        console.log("Error: ", err);
      }
    });
    this.web3.setProvider(this.ganache.provider);
    this.accounts = await this.getAccounts();
  }

  get provider() {
    return this.ganache.provider;
  }

  getAccounts() {
    return new _promise2.default((resolve, reject) => {
      this.web3.eth.getAccounts((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  compile(_config) {
    console.log("Start compile!");
    return new _promise2.default(function (resolve, reject) {
      _external.Profiler.updated(_config, (err, updated) => {
        if (err) return reject(err);

        updated = updated || [];

        // Compile project contracts and test contracts
        let config = (0, _assign2.default)(_config, {
          all: _config.compileAll === true,
          files: updated,
          quiet: false,
          quietWrite: true
        });
        _external.Contracts.compile(config, (err, abstractions, paths) => {
          if (err) return reject(err);
          resolve(paths);
        });
      });
    });
  }

  migrate(_config) {
    console.log("Start migrate!");
    return new _promise2.default((resolve, reject) => {
      let config = (0, _assign2.default)(_config, {
        reset: true,
        quiet: true
      });
      _external.Migrate.run(config, (err, res) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  close() {
    this.ganache.close();
  }
};
exports.default = Server;