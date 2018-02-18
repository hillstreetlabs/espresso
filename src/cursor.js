export const hideCursor = () => {
  process.stdout.write("\u001b[?25l");
};

export const showCursor = () => {
  process.stdout.write("\u001b[?25h");
};
