import pino from 'pino'
import config from 'config'
export interface ILoggerOptions {
    serviceName: string;
    level: string;
}

export interface ILoggerGlobalConfig {
  level: string;
  prettyPrint: boolean;
}

export default function createLogger (opts: ILoggerOptions) : pino.Logger {
  const globalLoggerConfig = config.get<ILoggerGlobalConfig>('logging')
  const transport = globalLoggerConfig.prettyPrint
    ? {
        target: 'pino-pretty'
      }
    : undefined

  return pino({
    name: opts.serviceName,
    level: opts.level,
    transport: transport
  })
}
