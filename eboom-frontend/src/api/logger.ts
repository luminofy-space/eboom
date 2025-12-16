export type LogLevel = "debug" | "info" | "warn" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogMethod = (message: string, meta?: Record<string, any>) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  group: (label: string) => void;
  groupEnd: () => void;
}

const isBrowser = typeof window !== "undefined";
const isProd = process.env.NODE_ENV === "production";

const styles = {
  base: "padding: 2px 6px; border-radius: 4px; font-weight: bold;",
  debug: "background: #d6eaff; color: #1e3a8a;",
  info: "background: #e6fffa; color: #0f766e;",
  warn: "background: #fef9c3; color: #92400e;",
  error: "background: #fee2e2; color: #991b1b;",
};

function styledHeader(level: LogLevel, msg: string) {
  if (!isBrowser) return `[${level.toUpperCase()}] ${msg}`;

  const css = styles[level] ?? styles.base;
  return [
    `%c${level.toUpperCase()}%c ${msg}`,
    `${styles.base} ${css}`,
    "color: inherit; font-weight: normal;",
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function print(level: LogLevel, message: string, meta?: Record<string, any>) {
  const header = styledHeader(level, message);

  if (isBrowser) {
    (console[level] || console.log)(...header);
    if (meta) console.log(meta);
  } else {
    const base = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    console[level](meta ? `${base} | ${JSON.stringify(meta)}` : base);
  }
}

const logger: Logger = {
  debug(message, meta) {
    if (!isProd) print("debug", message, meta);
  },
  info(message, meta) {
    print("info", message, meta);
  },
  warn(message, meta) {
    print("warn", message, meta);
  },
  error(message, meta) {
    print("error", message, meta);
  },

  group(label) {
    if (isBrowser) {
      console.groupCollapsed(`%c${label}`, "font-weight:bold; color:#555;");
    } else {
      console.log(`--- ${label} ---`);
    }
  },

  groupEnd() {
    if (isBrowser) console.groupEnd();
  },
};

export default logger;