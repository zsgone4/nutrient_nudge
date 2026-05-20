/**
 * Tiny leveled logger. Single dependency-free module so it works in Bun, Node,
 * and tests without setup.
 *
 *   log.info("signup.created", { userId, email })
 *   log.error("ai.zach.failed", { err, userId })
 *
 * Output shape (one line per call):
 *   2026-05-20T17:31:04.812Z  INFO  signup.created  userId=abc email=a@b.com
 *
 * Errors get their message and stack flattened so they don't render as "[object Object]".
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL: number =
  LEVELS[(process.env.LOG_LEVEL as Level) ?? (process.env.NODE_ENV === "production" ? "info" : "debug")] ?? LEVELS.info;

function flatten(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`;
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function format(level: Level, event: string, fields?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const head = `${ts}  ${level.toUpperCase().padEnd(5)} ${event}`;
  if (!fields) return head;
  const tail = Object.entries(fields)
    .map(([k, v]) => `${k}=${flatten(v)}`)
    .join(" ");
  return tail ? `${head}  ${tail}` : head;
}

function emit(level: Level, event: string, fields?: Record<string, unknown>) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const line = format(level, event, fields);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
