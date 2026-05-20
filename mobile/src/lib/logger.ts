/**
 * Tiny leveled logger for the mobile app.
 *
 *   log.info("food.added", { foodId, mealType })
 *   log.error("fetch.signup.failed", { err, status })
 *
 * - In dev (__DEV__), all levels go to console with a tag.
 * - In release builds, debug is dropped and the rest still hit console (so
 *   crash reporters / native log streams capture them). Swap in a remote
 *   transport later by replacing the `emit` body.
 *
 * Errors get their name/message/stack flattened so they don't render as "[object Object]".
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDev = typeof (globalThis as any).__DEV__ !== "undefined" ? (globalThis as any).__DEV__ : true;
const MIN_LEVEL = isDev ? LEVELS.debug : LEVELS.info;

function flatten(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function emit(level: Level, event: string, fields?: Record<string, unknown>) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const payload = fields
    ? Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, flatten(v)]))
    : undefined;
  const prefix = `[${level}] ${event}`;
  if (level === "error") console.error(prefix, payload ?? "");
  else if (level === "warn") console.warn(prefix, payload ?? "");
  else console.log(prefix, payload ?? "");
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
