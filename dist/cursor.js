"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const hideCursor = exports.hideCursor = () => {
  process.stdout.write("\u001b[?25l");
};

const showCursor = exports.showCursor = () => {
  process.stdout.write("\u001b[?25h");
};