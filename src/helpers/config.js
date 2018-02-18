import { Config } from "../truffle/helpers";

const getTestConfig = function() {
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

export { getTestConfig, getAccounts };
