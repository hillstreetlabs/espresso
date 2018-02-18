import Ganache from "ganache-core";
import Web3 from "web3";
import { Profiler, Contracts, Migrate } from "./truffle/external";

export default class Server {
  constructor() {
    this.ganache = Ganache.server();
    this.web3 = new Web3();
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
