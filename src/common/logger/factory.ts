import pino, { SerializerFn } from 'pino'
import config from 'config'
export interface IRedactOptions {
    paths: string[];
    censor?: string | ((value: any, path: string[]) => any);
    remove?: boolean;
}

export interface ILoggerOptions {
    serviceName: string;
    level: string;
    serializers?: { [key: string]: SerializerFn },
    redact?: string[] | IRedactOptions;
}

export interface ILoggerGlobalConfig {
  level: string;
  prettyPrint: boolean;
}

function buildLoggerOpts (opts: ILoggerOptions, prettyPrint: boolean) : pino.LoggerOptions {
  const retOpt : pino.LoggerOptions = {
    name: opts.serviceName,
    level: opts.level,
    redact: opts.redact,
    serializers: opts.serializers
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
      level: opts.level,
      serializers: opts.serializers,
      redact: opts.redact
    })
  }
}
