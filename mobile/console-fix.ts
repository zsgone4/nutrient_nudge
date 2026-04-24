// Must be the first import in index.ts — Metro hoists imports before inline code,
// so the override must live in its own module to run before React Native initialises.
const _orig = console.error.bind(console);
// @ts-ignore
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("React Native version mismatch")) {
    return;
  }
  _orig(...args);
};
