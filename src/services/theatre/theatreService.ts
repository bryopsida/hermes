import { HeartbeatActor } from '../../actors/heartbeat/heartbeatActor'
import { JsonProcessorActor } from '../../actors/jsonProcessor/jsonProcessorActor'
import { JsonWatchActor } from '../../actors/jsonWatch/jsonWatchActor'
import { ClassifierClient } from '../../clients/classifiersClient'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import { IActor } from '../../common/interfaces/actor'
import { IService } from '../../common/interfaces/service'
import createLogger from '../../common/logger/factory'
import kafkaConfigFactory, { IKafkaConfig } from '../../config/kafkaConfig'
import { ITaskClientFactory, TaskClientFactory } from '../../factories/taskClientFactory'
import config from 'config'
import { ClientCredentialProviderFactory } from '../../factories/clientCredentialProvider'

export class TheatreService implements IService {
  private readonly log = createLogger({
    serviceName: `theatre-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  public static readonly NAME = 'theatre'

  private readonly actors : Array<IActor<unknown, unknown>> = []
  public readonly ID = TheatreService.NAME
  public readonly ORDER = 1

  private readonly kafkaConfig: IKafkaConfig
  private readonly taskClientFactory: ITaskClientFactory
  private readonly classifierClient: ClassifierClient

  constructor () {
    this.log.info('Theatre service created')
    this.kafkaConfig = kafkaConfigFactory.buildConfig(TheatreService.NAME)
    this.taskClientFactory = new TaskClientFactory()
    this.classifierClient = new ClassifierClient({
      baseUrl: config.get<string>('theatre.classifierApi.baseUrl'),
      credentialProvider: ClientCredentialProviderFactory.create(config, {
        scope: 'theatre.classifierApi',
        username: 'username',
        password: 'password'

      })
    })
    this.createActors()
  }

  private async createActors () : Promise<void> {
    this.actors.push(new JsonWatchActor(this.kafkaConfig))
    this.actors.push(new HeartbeatActor(this.kafkaConfig))
    this.actors.push(new JsonProcessorActor(this.kafkaConfig, await this.taskClientFactory.createClient({} as any), this.classifierClient))
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
