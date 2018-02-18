import { watchFile } from "fs";

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

export { watch };
