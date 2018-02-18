var mocha = require("mocha");
var colors = require("colors/safe");
module.exports = MiniReporter;

function MiniReporter(runner) {
  mocha.reporters.Base.call(this, runner);
  var passes = 0;
  var failures = 0;

  runner.on("pass", function(test) {
    passes++;
    console.log(colors.white.bgGreen(" pass "), test.fullTitle());
  });

  runner.on("fail", function(test, err) {
    failures++;
    console.log(
      colors.white.bgRed(" fail "),
      " -- error: ",
      test.fullTitle(),
      err.message
    );
  });

  runner.on("end", function() {
    console.log("end: %d/%d tests passing", passes, passes + failures);
    passes = 0;
    failures = 0;
  });
}
