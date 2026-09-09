type Level = "debug" | "info" | "warn" | "error";

const COLORS: Record<Level, string> = {
  debug: "\x1b[90m", // grey
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

const DEBUG = process.env.QA_DEBUG === "1" || process.env.DEBUG === "1";

function emit(level: Level, scope: string, msg: string, meta?: unknown) {
  if (level === "debug" && !DEBUG) return;
  const tag = `${COLORS[level]}[${level.toUpperCase()}]${RESET}`;
  const prefix = `${tag} (${scope})`;
  if (meta !== undefined) {
    console.log(prefix, msg, meta);
  } else {
    console.log(prefix, msg);
  }
}

/**
 * Tiny scoped logger shared by helpers and agents. Use `logger.scope("qase")`
 * to tag output by subsystem. Debug lines are silenced unless QA_DEBUG=1.
 */
export const logger = {
  scope(scope: string) {
    return {
      debug: (msg: string, meta?: unknown) => emit("debug", scope, msg, meta),
      info: (msg: string, meta?: unknown) => emit("info", scope, msg, meta),
      warn: (msg: string, meta?: unknown) => emit("warn", scope, msg, meta),
      error: (msg: string, meta?: unknown) => emit("error", scope, msg, meta),
    };
  },
};

export type ScopedLogger = ReturnType<typeof logger.scope>;
