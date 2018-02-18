import path from "path";
import { Config } from "../truffle/helpers";

const getTestConfig = function() {
  let config = Config.detect({
    workingDirectory: path.resolve("."),
    buildFolder: ".test",
    networks: {
      test: {
        host: "localhost",
        port: 8545,
        network_id: "*"
      }
    }
  });

  config.network = "test";

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

export { getTestConfig, getAccounts };
