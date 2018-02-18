import path from "path";
import fs, { watchFile } from "fs";

export const watch = (config, files, callback) => {
  if (files.length > 0) {
    let options = { interval: 100 };
    files.forEach(function(file) {
      watchFile(file, options, function(curr, prev) {
        if (prev.mtime < curr.mtime) {
          callback();
        }
      });
    });
  }
};
