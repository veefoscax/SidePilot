/**
 * Structured Logger
 * 
 * Provides consistent logging with prefixes for easy filtering.
 * P2 QA fix for better debugging in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;
    data?: unknown;
}

/**
 * Logger configuration
 */
const config = {
    enabled: true,
    minLevel: 'debug' as LogLevel,
    prefix: '[SidePilot]',
};

const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
    return `${config.prefix}[${entry.level.toUpperCase()}][${entry.module}] ${entry.message}`;
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
    return config.enabled && levelPriority[level] >= levelPriority[config.minLevel];
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string) {
    const log = (level: LogLevel, message: string, data?: unknown) => {
        if (!shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            module,
            message,
            data,
        };

        const formattedMessage = formatLogEntry(entry);

        switch (level) {
            case 'debug':
                if (data !== undefined) {
                    console.log(formattedMessage, data);
                } else {
                    console.log(formattedMessage);
                }
                break;
            case 'info':
                if (data !== undefined) {
                    console.info(formattedMessage, data);
                } else {
                    console.info(formattedMessage);
                }
                break;
            case 'warn':
                if (data !== undefined) {
                    console.warn(formattedMessage, data);
                } else {
                    console.warn(formattedMessage);
                }
                break;
            case 'error':
                if (data !== undefined) {
                    console.error(formattedMessage, data);
                } else {
                    console.error(formattedMessage);
                }
                break;
        }
    };

    return {
        debug: (message: string, data?: unknown) => log('debug', message, data),
        info: (message: string, data?: unknown) => log('info', message, data),
        warn: (message: string, data?: unknown) => log('warn', message, data),
        error: (message: string, data?: unknown) => log('error', message, data),
    };
}

/**
 * Configure logger settings
 */
export function configureLogger(options: Partial<typeof config>) {
    Object.assign(config, options);
}

/**
 * Default logger instance
 */
export const logger = createLogger('Core');
