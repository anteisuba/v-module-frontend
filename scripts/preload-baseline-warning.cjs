process.env.BROWSERSLIST_IGNORE_OLD_DATA ??= "1";
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA ??= "1";

const originalWarn = console.warn.bind(console);

console.warn = (...args) => {
  const message = args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }

      if (arg instanceof Error) {
        return arg.message;
      }

      return String(arg);
    })
    .join(" ");

  if (message.includes("[baseline-browser-mapping]")) {
    return;
  }

  originalWarn(...args);
};
