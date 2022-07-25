import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export interface IContext {
  baseUrl: string;
  auth?: {
    type: string;
    usernameFilePath: string;
    passwordFilePath: string;
  }
}

export interface IConfig {
  currentContext: string;
  contexts: Map<string, IContext>;
}

export class Config implements IConfig {
  public currentContext: string = 'N/A'
  public contexts: Map<string, IContext> = new Map()

  constructor (json: string) {
    const config = JSON.parse(json)
    this.currentContext = config.currentContext
    this.contexts = new Map(Object.entries(config.contexts))
  }
}

export interface IConfigurationManager {
  getCurrentContext(): Promise<string>;
  setCurrentContext(contextName: string): Promise<IContext>;
  getContexts(): Promise<Map<string, IContext>>;
  getContext(contextName: string): Promise<IContext|undefined>;
  setContext(contextName: string, context: IContext): Promise<IContext>;
  removeContext(contextName: string): Promise<void>;
}

export class ConfigurationManager implements IConfigurationManager {
  private readonly configFilePath: string
  private pendingOperation: Promise<unknown> | undefined
  private multiStepOperation: Promise<unknown> | undefined

  constructor (configFilePath: string|undefined = undefined) {
    this.configFilePath = configFilePath || process.env.PANDORA_CONFIG_FILE_PATH || path.join(os.homedir(), '.pandora/config.json')
    this.createFileIfNotExists()
  }

  private async createFileIfNotExists (): Promise<void> {
    this.pendingOperation = fs.access(this.configFilePath).catch(() => {
      return fs.mkdir(path.dirname(this.configFilePath), { recursive: true }).then(() => {
        const config = {
          currentContext: 'local',
          contexts: {
            local: {
              baseUrl: 'http://localhost:3000'
            }
          }
        }
        const json = JSON.stringify(config, null, 2)
        return fs.writeFile(this.configFilePath, json, {
          encoding: 'utf8',
          flag: 'w'
        })
      })
    })
  }

  private async readConfig (partOfMultiStep: boolean = false): Promise<IConfig> {
    if (this.multiStepOperation !== undefined && !partOfMultiStep) await this.multiStepOperation
    if (this.pendingOperation !== undefined) await this.pendingOperation
    this.pendingOperation = fs.readFile(this.configFilePath, 'utf8')
    const configFileJson = (await this.pendingOperation) as string
    return new Config(configFileJson)
  }

  private async writeConfig (config: IConfig, partOfMultiStep: boolean = false): Promise<void> {
    if (this.multiStepOperation !== undefined && !partOfMultiStep) await this.multiStepOperation
    if (this.pendingOperation !== undefined) await this.pendingOperation
    this.pendingOperation = fs.writeFile(this.configFilePath, JSON.stringify(config, null, 2))
    await this.pendingOperation
  }

  async getCurrentContext (): Promise<string> {
    const config = await this.readConfig()
    return config.currentContext
  }

  async setCurrentContext (contextName: string): Promise<IContext> {
    if (this.multiStepOperation !== undefined) await this.multiStepOperation
    this.multiStepOperation = this.readConfig(true).then((config) => {
      config.currentContext = contextName
      return config
    }).then((config) => this.writeConfig(config, true)).then(() => this.readConfig(true))
    return this.multiStepOperation as Promise<IContext>
  }

  getContexts (): Promise<Map<string, IContext>> {
    return this.readConfig().then((config) => config.contexts)
  }

  getContext (contextName: string): Promise<IContext|undefined> {
    return this.readConfig().then((config) => config.contexts.get(contextName))
  }

  async setContext (contextName: string, context: IContext): Promise<IContext> {
    if (this.multiStepOperation !== undefined) await this.multiStepOperation
    this.multiStepOperation = this.readConfig(true).then((config) => {
      config.contexts.set(contextName, context)
      return config
    }).then((config) => this.writeConfig(config, true))
      .then(() => this.readConfig(true))
      .then((config) => config.contexts.get(contextName))
    return this.multiStepOperation as Promise<IContext>
  }

  async removeContext (contextName: string): Promise<void> {
    if (this.multiStepOperation !== undefined) await this.multiStepOperation
    this.multiStepOperation = this.readConfig(true).then((config) => {
      config.contexts.delete(contextName)
      return config
    }).then((config) => this.writeConfig(config, true))
    return this.multiStepOperation as Promise<void>
  }
}
