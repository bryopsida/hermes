import { HeartbeatActor } from '../../actors/heartbeat/heartbeatActor'
import { JsonWatchActor } from '../../actors/jsonWatch/jsonWatchActor'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActor } from '../../common/interfaces/actor'
import { IService } from '../../common/interfaces/service'
import createLogger from '../../common/logger/factory'

export class TheatreService implements IService {
    private readonly log = createLogger({
      serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
      level: 'debug'
    })

    public static readonly NAME = 'theatre'

    private readonly actors : Array<IActor<unknown, unknown>> = [];
    public readonly ID = TheatreService.NAME

    constructor () {
      this.log.info('Theatre service created')
      this.actors.push(new JsonWatchActor())
      this.actors.push(new HeartbeatActor())
    }

    isAlive (): Promise<boolean> {
      return Promise.resolve(true)
    }

    canServeTraffic (): Promise<boolean> {
      return Promise.resolve(false)
    }

    servesTraffic (): boolean {
      return false
    }

    async start (): Promise<void> {
      // bind kafka consumers
      await Promise.all(this.actors.map(async (actor) => {
        this.log.info(`Starting message processing for actor ${actor.name}`)
        await actor.startProcessing()
      }))
      this.log.info('Theatre service started')
    }

    async stop (): Promise<void> {
      // unbind kafka consumers
      await Promise.all(this.actors.map(async (actor) => {
        this.log.info(`Stopping message processing for actor ${actor.name}`)
        await actor.stopProcessing()
      }))
      this.log.info('Theatre service stopped')
    }

    async destroy (): Promise<void> {
      this.log.warn('Theatre service destoryed')
    }
}
