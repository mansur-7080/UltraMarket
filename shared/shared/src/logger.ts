import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] === 'development';

// Create logger instance
export const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    serviceName: process.env['SERVICE_NAME'] || 'unknown-service',
    env: process.env['NODE_ENV'] || 'development',
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child logger for specific modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Log levels
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];
