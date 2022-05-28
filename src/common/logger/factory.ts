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

function buildLoggerOpts (opts: ILoggerOptions, prettyPrint: boolean) : pino.LoggerOptions {
  const retOpt : pino.LoggerOptions = {
    name: opts.serviceName,
    level: opts.level
  }
  if (prettyPrint) {
    retOpt.prettyPrint = {
      levelFirst: true
    }
  }
  return retOpt
}

export default function createLogger (opts: ILoggerOptions) : pino.Logger {
  if (config.has('logging')) {
    const globalLoggerConfig = config.get<ILoggerGlobalConfig>('logging')
    const prettyPrintEnabled = globalLoggerConfig.prettyPrint || process.env.LOGGING_PRETTY_PRINT === 'true'
    const logOpts = buildLoggerOpts(opts, prettyPrintEnabled)

    return pino(logOpts)
  } else {
    return pino({
      name: opts.serviceName,
      level: opts.level
    })
  }
}
