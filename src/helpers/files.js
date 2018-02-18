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

const parseTestFiles = path => {
  const stats = fs.lstatSync(path);
  if (stats.isFile() && path.substr(-3) === ".js") {
    files = [path.resolve(path)];
  } else if (stats.isDirectory()) {
    files = fs.readdirSync(path.resolve(path)).filter(function(file) {
      return file.substr(-3) === ".js";
    });
  }
};

export { watch, parseTestFiles };
