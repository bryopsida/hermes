import argon2 from 'argon2'
import { FastifyReply, FastifyRequest } from 'fastify'
import COMPUTED_CONSTANTS from './computedConstants'
import createLogger from './logger/factory'

interface IServiceRoleMap {
  roles: string[]
}

interface IServicesRoleMap {
  [serviceName: string]: IServiceRoleMap
}

interface IStoredUser {
  username: string
  password: string,
  org: string,
  services: IServicesRoleMap
}

export class EmbeddedAuthentication {
  private readonly _userStorePath: string
  private readonly _users: IStoredUser[]
  private log = createLogger({
    serviceName: `auth-embedded-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  constructor (userStorePath: string) {
    this._userStorePath = userStorePath
    this._users = require(userStorePath)
    this.log.debug(`Loaded account information from: ${userStorePath}`)
    if (this._users == null || this._users.length === 0) {
      throw new Error(`No users found in ${userStorePath}`)
    }
  }

  public authenticate (username: string, password: string, request: FastifyRequest, reply: FastifyReply, done: Function) {
    this.log.debug('Validating credentials with embedded basic auth')
    // check if the user exists
    const user = this._users.find(u => u.username === username)
    if (!user) {
      this.log.debug(`Attempted authentication for user ${username} failed, username does not exist!`)
      return done(new Error('Invalid username or password'))
    }
    argon2.verify(user.password, password).then((result) => {
      if (!result) {
        this.log.debug(`Attempted authentication for user ${username} failed, invalid credentials!`)
        return done(new Error('Invalid username or password'))
      }
      this.log.debug(`User ${username} successfully authenticated`)
      return done()
    })
  }
}
