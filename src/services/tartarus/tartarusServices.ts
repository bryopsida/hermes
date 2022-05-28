import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IService } from '../../common/interfaces/service'
import createLogger from '../../common/logger/factory'
import { ITartarusConfigFactory, buildConfig } from '../../config/gateConfig'
import { IGate } from './gates/gate'
import { IGateFactory, GateFactory } from './gates/gateFactory'

/**
 * Tartarus Service
 * Purpose: Provide a secure tunneling service between two parties capable of handling multiple tunneled sessions in one connection
 * Responsibilities:
 * - Create the correct gates based on configuration
 * - Start and stop the gates when service is started/stopped
 * - Create bridge manager
 * - Rudimentary health checks (future)
 * - Coalesce metrics from all gates and make available via prometheus (future)
 */
export class TartarusService implements IService {
  public static readonly NAME = 'tartarus'
  ID: string = TartarusService.NAME
  ORDER: number = 1

  private readonly _gates: IGate[] = []

  private readonly log = createLogger({
    serviceName: `tartarus-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (private readonly _gateFactory: IGateFactory = new GateFactory(), configFactory: ITartarusConfigFactory = buildConfig) {
    // Create gates based on configuration
    const config = configFactory()
    config.gates.forEach(gateConfig => {
      this._gateFactory.create(gateConfig).then(gate => {
        this._gates.push(gate)
      }).catch((err) => {
        this.log.error('Error while creating gate: ', err)
      })
    })
  }

  async start (): Promise<void> {
    this.log.info('Starting tartarus service')
    for (const gate of this._gates) {
      await gate.open()
    }
    this.log.info('Finished starting tartarus service')
  }

  async stop (): Promise<void> {
    this.log.info('Stopping tartarus service')
    for (const gate of this._gates) {
      await gate.close()
    }
    this.log.info('Finished stopping tartarus service')
  }

  async destroy (): Promise<void> {
    await this.stop()
  }

  isAlive (): Promise<boolean> {
    return Promise.resolve(true)
  }

  canServeTraffic (): Promise<boolean> {
    return Promise.resolve(true)
  }

  servesTraffic (): boolean {
    return true
  }
}
