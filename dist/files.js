"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.watch = undefined;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const watch = exports.watch = (config, files, callback) => {
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