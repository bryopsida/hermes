import { randomBytes } from 'crypto'
import { access, writeFile } from 'fs/promises'
import config from 'config'
import { resolveHome } from '../fs/resolve'
import computedConstants from '../computedConstants'
import createLogger from '../logger/factory'

const logger = createLogger({
  serviceName: `seed-key-${computedConstants.id}`,
  level: 'debug'
})

async function fileExists (path: string) : Promise<boolean> {
  try {
    await access(resolveHome(path))
    return true
  } catch (e) {
    return false
  }
}

function createKey (size: number) : Promise<Buffer> {
  return Promise.resolve(randomBytes(size))
}

function saveKey (key: Buffer, keyPath: string) : Promise<void> {
  logger.debug('Saving key to %s', keyPath)
  return writeFile(resolveHome(keyPath), key.toString('base64'), {
    flag: 'w+'
  })
}

async function ensureKey (keyPath: string, length: number) : Promise<void> {
  if (!await fileExists(keyPath)) {
    await saveKey(await createKey(length), keyPath)
  }
}

export async function seedKeys () : Promise<void> {
  const env = process.env.NODE_ENV
  if (env !== 'development' && env !== 'dev' && env !== 'test') {
    throw new Error(`seedKeys() should only be called in development or test environments, not ${env}! See docs on what values to setup for prod.`)
  }
  // need to check if masterKey, masterContext, storePassword, storeSalt, storeContext are set
  const masterKeyPath = config.get<string>('defaultCrypto.masterKeyPath')
  const masterContextPath = config.get<string>('defaultCrypto.masterContextPath')
  const storePasswordPath = config.get<string>('defaultCrypto.store.passwordPath')
  const storeSaltPath = config.get<string>('defaultCrypto.store.saltPath')
  const storeContextPath = config.get<string>('defaultCrypto.store.contextPath')

  logger.debug(`Ensuring keys are present at: ${masterKeyPath}, ${masterContextPath}, ${storePasswordPath}, ${storeSaltPath}, ${storeContextPath}`)

  ensureKey(masterKeyPath, 32)
  ensureKey(masterContextPath, 32)
  ensureKey(storePasswordPath, 32)
  ensureKey(storeSaltPath, 16)
  ensureKey(storeContextPath, 32)
}
