import { Profiler, Contracts, Migrate } from "../truffle/external";

const compileContracts = function(config, testResolver) {
  return new Promise(function(resolve, reject) {
    Profiler.updated(
      config.with({
        resolver: testResolver
      }),
      function(err, updated) {
        console.log(updated);
        if (err) return reject(err);

        updated = updated || [];

        // Compile project contracts and test contracts
        Contracts.compile(
          config.with({
            all: config.compileAll === true,
            files: updated,
            resolver: testResolver,
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

const performDeploy = function(config, resolver) {
  return new Promise(function(resolve, reject) {
    Migrate.run(
      config.with({
        reset: true,
        resolver: resolver,
        quiet: true
      }),
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

export { compileContracts, performDeploy };
