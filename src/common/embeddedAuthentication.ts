import argon2 from 'argon2'
import { FastifyReply, FastifyRequest } from 'fastify'

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
  private readonly _users: IStoredUser[];

  constructor (userStorePath: string) {
    this._userStorePath = userStorePath
    this._users = require(userStorePath)
  }

  public authenticate (username: string, password: string, request: FastifyRequest, reply: FastifyReply, done: Function) {
    // check if the user exists
    const user = this._users.find(u => u.username === username)
    if (!user) {
      return done(new Error('Invalid username or password'))
    }
    argon2.verify(user.password, password).then((result) => {
      if (!result) {
        return done(new Error('Invalid username or password'))
      }
      return done()
    })
  }
}
