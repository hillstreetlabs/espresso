import path from "path";
import fs, { watchFile } from "fs";

const watch = (config, files, callback) => {
  let options = { interval: 100 };
  files.forEach(function(file) {
    watchFile(file, options, function(curr, prev) {
      if (prev.mtime < curr.mtime) {
        callback();
      }
    });
  });
};

const parseTestFiles = testPath => {
  let files = [];
  const stats = fs.lstatSync(testPath);
  if (stats.isFile() && testPath.substr(-3) === ".js") {
    files = [path.resolve(testPath)];
  } else if (stats.isDirectory()) {
    files = fs.readdirSync(path.resolve(testPath)).filter(function(file) {
      return file.substr(-3) === ".js";
    });
  }
  return files;
};

export { watch, parseTestFiles };
