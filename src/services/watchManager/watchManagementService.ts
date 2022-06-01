import { FastifyInstance } from 'fastify'
import mongoose from 'mongoose'
import { IService } from '../../common/interfaces/service'
import watchRoutes from './routes/watchRoutes'

// What is a watch?
// A condition that when triggered something should happen. For example if a numerical value
// Goes above a certain threshold, the watch should flip it's state and say it's triggered, but...
// A watch should not be tightly coupled to the things that it triggers. The actions that happen
// when a watch changes state should be their own seperate entities reacting to watch state changes.
// It should create a global state for that's flipped when any source triggers it, and individual states for each source to allow scoped actions for each.
// A watch should generate data that can also be watched (watch watching a watch state)
// A watch is an actor and reactive, meaning it works off of topics and messages.
//
// What is needed to define a watch
// 1) A unique ID
// 2) A name
// 3) A query ideally looking at classifier metadata to work with a wide range of sources, not a specific format.
// 4) Time/Duration conditions to filter flappiness on state transitions
// 5) A list of topics to watch/query against
export class WatchManagementService implements IService {
  public static readonly NAME = 'watch_manager'
  public readonly ORDER: number = 1
  public readonly ID = WatchManagementService.NAME
  constructor (private readonly fastify: FastifyInstance) {
    // register routes
    fastify.register(watchRoutes, { prefix: '/api/watch_manager/v1' })
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

  start (): Promise<void> {
    // on startup restore scheduled tasks
    return Promise.resolve()
  }

  stop (): Promise<void> {
    // cannot remove routes from fastify as of yet, also wouldn't be appropriate to stop the server instance.
    // could set a flag to 404 on all routes and remove it if started again.
    return Promise.resolve()
  }

  async destroy (): Promise<void> {
    await mongoose.disconnect()
  }
}
