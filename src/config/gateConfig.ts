import config from 'config'

export enum GateType {
  TCP = 'tcp'
}

export interface IGateConfig {
  type: GateType
}
export interface ITCPGateConfig extends IGateConfig {
  host: string
  port: number
}

export interface ITartarusConfig {
  enabled: boolean;
  gates: IGateConfig[];
}

export interface ITartarusConfigFactory {
  (): ITartarusConfig
}

export function buildConfig (): ITartarusConfig {
  return config.get<ITartarusConfig>('tartarus')
}
