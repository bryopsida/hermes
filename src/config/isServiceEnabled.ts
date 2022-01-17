import config from 'config'

export function isServiceEnabled (serviceName: string) : boolean {
  if (config.has(`${serviceName}.enabled`)) {
    return config.get(`${serviceName}.enabled`)
  }
  return false
}

export function isSideKickEnabled (sideKickName: string) : boolean {
  if (config.has(`sidekicks.${sideKickName}.enabled`)) {
    return config.get(`sidekicks.${sideKickName}.enabled`)
  }
  return false
}
