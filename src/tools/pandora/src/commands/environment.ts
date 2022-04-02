import { IConfigurationManager, IContext } from '../utils/config'

export class EnvironmentCommand {
  private readonly config;

  constructor (config: IConfigurationManager) {
    this.config = config
  }

  setEnvironment (env: string) {
    return this.config.setCurrentContext(env)
  }

  getCurrentEnvironment () : Promise<string> {
    return this.config.getCurrentContext()
  }

  getContext (env: string) : Promise<IContext|undefined> {
    return this.config.getContext(env)
  }
}
