/**
 * This service is responsible for managing user accounts.
 */
import { FastifyInstance } from 'fastify'
import { IService } from '../../common/interfaces/service'

export class UserService implements IService {
  readonly ID: string;

  constructor (app: FastifyInstance) {
    this.ID = 'user'
  }

  start (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  stop (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  destroy (): Promise<void> {
    throw new Error('Method not implemented.')
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
