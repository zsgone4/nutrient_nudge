/**
 * Tiny leveled logger for the admin dashboard.
 *
 *   log.info("users.loaded", { count })
 *   log.error("api.fetch.failed", { err, endpoint })
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL = import.meta.env.PROD ? LEVELS.info : LEVELS.debug;

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
