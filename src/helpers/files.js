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

const parseTestFiles = (config, testPath) => {
  let files = [];
  const stats = fs.lstatSync(testPath);
  if (stats.isFile() && testPath.substr(-3) === ".js") {
    files = [path.resolve(testPath)];
  } else if (stats.isDirectory()) {
    const temp = fs.readdirSync(path.resolve(testPath)).filter(function(file) {
      return file.substr(-3) === ".js";
    });
    temp.forEach(function(file) {
      files.push(path.join(config.test_directory, file));
    });
  }
  return files;
};

export { watch, parseTestFiles };
