import path from "path";
import fs, { watchFile } from "fs";

export const watch = (config, files, callback) => {
  let options = { interval: 100 };
  files.forEach(function(file) {
    watchFile(file, options, function(curr, prev) {
      if (prev.mtime < curr.mtime) {
        callback();
      }
    });
  });
};
