import Redis from 'ioredis'
import { isEmpty } from 'lodash'
import { Adapter, AdapterPayload } from 'oidc-provider'
import configFactory from '../../config/redisConfig'
import { IUsableClosable } from '../../common/using'

const redisConfig = configFactory.buildConfig('identity')

export class RedisClientSingleton {
  private static _instance : RedisClientSingleton;
  private _isDisposed : boolean;

  private readonly _redisClient: Redis.Redis;

  private constructor () {
    this._isDisposed = false
    this._redisClient = new Redis(`redis://${redisConfig.host}:${redisConfig.port}`, { keyPrefix: 'oidc:', password: redisConfig.password })
  }

  public getClient () : Redis.Redis {
    if (this._isDisposed) throw new Error('Redis client object disposed')
    return this._redisClient
  }

  public closeClient () : Promise<unknown> {
    this._isDisposed = true
    this._redisClient.disconnect(false)
    return Promise.resolve()
  }

  public static getInstance () {
    if (!this._instance) this._instance = new RedisClientSingleton()
    return this._instance
  }
}

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest'
])

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest'
])

function grantKeyFor (id : string) : string {
  return `grant:${id}`
}

function userCodeKeyFor (userCode : string) : string {
  return `userCode:${userCode}`
}

function uidKeyFor (uid : string) : string {
  return `uid:${uid}`
}

export class OidcRedisAdapter implements Adapter, IUsableClosable {
  private readonly name: string;

  constructor (name : string) {
    this.name = name
  }

  public async close (): Promise<void> {
    await RedisClientSingleton.getInstance().closeClient()
  }

  async upsert (id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined> {
    const key = this.key(id)
    const multi = RedisClientSingleton.getInstance().getClient().multi()
    if (consumable.has(this.name)) {
      const store = {
        payload: JSON.stringify(payload)
      }
      multi.hmset(key, store)
    } else {
      const store = JSON.stringify(payload)
      multi.set(key, store)
    }

    if (expiresIn) {
      multi.expire(key, expiresIn)
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId)
      multi.rpush(grantKey, key)
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await RedisClientSingleton.getInstance().getClient().ttl(grantKey)
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn)
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode)
      multi.set(userCodeKey, id)
      multi.expire(userCodeKey, expiresIn)
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid)
      multi.set(uidKey, id)
      multi.expire(uidKey, expiresIn)
    }

    await multi.exec()
  }

  async find (id: string|null): Promise<void | AdapterPayload | undefined> {
    const data = consumable.has(this.name)
      ? await RedisClientSingleton.getInstance().getClient().hgetall(this.key(id))
      : await RedisClientSingleton.getInstance().getClient().get(this.key(id))

    if (isEmpty(data)) {
      return undefined
    }

    if (typeof data === 'string') {
      return JSON.parse(data)
    }
    const payload = data ? JSON.parse(data.payload) : undefined
    if (data) {
      delete data.payload
    }
    const rest = data
    return {
      ...rest,
      ...JSON.parse(payload)
    }
  }

  async findByUserCode (userCode: string): Promise<void | AdapterPayload | undefined> {
    const id = await RedisClientSingleton.getInstance().getClient().get(userCodeKeyFor(userCode))
    return this.find(id)
  }

  async findByUid (uid: string): Promise<void | AdapterPayload | undefined> {
    const id = await RedisClientSingleton.getInstance().getClient().get(uidKeyFor(uid))
    return this.find(id)
  }

  async consume (id: string): Promise<void | undefined> {
    throw new Error('Method not implemented.')
  }

  async destroy (id: string): Promise<void | undefined> {
    const key = this.key(id)
    await RedisClientSingleton.getInstance().getClient().del(key)
  }

  async revokeByGrantId (grantId: string): Promise<void | undefined> {
    const multi = RedisClientSingleton.getInstance().getClient().multi()
    const tokens = await RedisClientSingleton.getInstance().getClient().lrange(grantKeyFor(grantId), 0, -1)
    tokens.forEach((token) => multi.del(token))
    multi.del(grantKeyFor(grantId))
    await multi.exec()
  }

  key (id: string|null): string {
    return `${this.name}:${id}`
  }
}
