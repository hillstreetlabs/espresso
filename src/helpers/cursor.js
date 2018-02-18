const hideCursor = () => {
  process.stdout.write("\u001b[?25l");
};

const showCursor = () => {
  process.stdout.write("\u001b[?25h");
};

export { hideCursor, showCursor };
