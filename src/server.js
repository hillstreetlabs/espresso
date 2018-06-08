import Ganache from "ganache-core";
import Web3 from "web3";
import portfinder from "portfinder";
import { Profiler, Contracts, Migrate } from "./truffle/external";

export default class Server {
  constructor(options = {}) {
    this.ganache = Ganache.server({
      default_balance_ether: 10000000
    });
    this.web3 = new Web3();
    this.accounts = [];
    portfinder.basePort = options.port || 8545;
  }

  async start() {
    this.port = await portfinder.getPortPromise();

    try {
      await this.ganache.listen(this.port);
      console.log("Launched test RPC on port: ", this.port);
    } catch (err) {
      console.log("Error: ", err);
    }
    this.web3.setProvider(this.ganache.provider);
    this.accounts = await this.getAccounts();
  }

  get provider() {
    return this.ganache.provider;
  }

  getAccounts() {
    return new Promise((resolve, reject) => {
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
    return new Promise(function(resolve, reject) {
      Profiler.updated(_config, (err, updated) => {
        if (err) return reject(err);

        updated = updated || [];

        // Compile project contracts and test contracts
        let config = Object.assign(_config, {
          all: _config.compileAll === true,
          files: updated,
          quiet: false,
          quietWrite: true
        });
        Contracts.compile(config, (err, abstractions, paths) => {
          if (err) return reject(err);
          resolve(paths);
        });
      });
    });
  }

  migrate(_config) {
    console.log("Start migrate!");
    return new Promise((resolve, reject) => {
      let config = Object.assign(_config, {
        reset: true,
        quiet: true
      });
      Migrate.run(config, (err, res) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  close() {
    this.ganache.close();
  }
}
