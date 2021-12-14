import pino from 'pino';

export interface ILoggerOptions {
    serviceName: string;
    level: string;
}

export default function createLogger(opts: ILoggerOptions) : pino.Logger {
    return pino({
        name: opts.serviceName,
        level: opts.level,
        transport: process.env.NODE_ENV !== 'production' ? {
            target: 'pino-pretty'
        } : undefined
    });
}