"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseTestFiles = exports.watch = undefined;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const watch = (config, files, callback) => {
  if (files.length > 0) {
    let options = { interval: 100 };
    files.forEach(function (file) {
      (0, _fs.watchFile)(file, options, function (curr, prev) {
        if (prev.mtime < curr.mtime) {
          callback();
        }
      });
    });
  }
};

const parseTestFiles = (config, testPath) => {
  let files = [];
  const stats = _fs2.default.lstatSync(testPath);
  if (stats.isFile() && testPath.substr(-3) === ".js") {
    files = [_path2.default.resolve(testPath)];
  } else if (stats.isDirectory()) {
    const temp = _fs2.default.readdirSync(_path2.default.resolve(testPath)).filter(function (file) {
      return file.substr(-3) === ".js";
    });
    temp.forEach(function (file) {
      files.push(_path2.default.join(config.test_directory, file));
    });
  }
  return files;
};

exports.watch = watch;
exports.parseTestFiles = parseTestFiles;