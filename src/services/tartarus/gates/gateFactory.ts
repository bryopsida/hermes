import { GateType, IGateConfig, ITCPGateConfig } from '../../../config/gateConfig'
import { IGate } from './gate'
import { TcpGate } from './tcp/tcpGate'

export interface IGateFactory {
  create (config: IGateConfig): Promise<IGate>;
}

export class GateFactory implements IGateFactory {
  async create (config: IGateConfig): Promise<IGate> {
    if (config.type === GateType.TCP) {
      return this.buildTcpGate(config)
    }
    throw new Error(`Unknown gate type: ${config.type}`)
  }

  private buildTcpGate (config: IGateConfig): IGate {
    return new TcpGate(config as ITCPGateConfig)
  }
}
