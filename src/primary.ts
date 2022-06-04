import createLogger from './common/logger/factory'
import cluster, { Worker } from 'cluster'
import { randomInt } from 'crypto'
import { AddressInfo } from 'net'

export class Primary {
  private readonly logger = createLogger({
    serviceName: 'primary-runner',
    level: 'debug'
  })

  // eslint-disable-next-line no-undef
  private statTimer?: NodeJS.Timer
  // eslint-disable-next-line no-undef
  private workerRestartTimers: Array<NodeJS.Timer> = []
  private isShuttingDown = false

  constructor (private workerCount: number) {
    this.logger.trace('Created primary runner')
  }

  private onExit (worker: Worker, code: number, signal: string) {
    if (this.isShuttingDown) {
      return
    }

    if (code === 0) {
      this.logger.debug(`Worker ${worker.process.pid} exited with code 0`)
      return
    }

    const restartDelay = randomInt(60000, 300000)
    this.logger.warn(`Worker ${worker.process.pid} died with none 0 exit code: ${code}, and signal ${signal}, restarting in ${restartDelay}ms`)

    const timer = setTimeout(() => {
      cluster.fork()
      this.workerRestartTimers.splice(this.workerRestartTimers.indexOf(timer), 1)
    }, restartDelay)
  }

  private onError (err: Error) {
    this.logger.error('Cluster error: ', err)
  }

  private onListening (worker: Worker, address: AddressInfo) {
    this.logger.debug(`Worker ${worker.process.pid} listening on ${address.address}:${address.port}`)
  }

  private onOnline (worker: Worker) {
    this.logger.debug(`Worker ${worker.process.pid} is online`)
  }

  public start () {
    this.logger.debug(`Starting primary runner, creating ${this.workerCount} workers`)
    cluster.on('exit', this.onExit.bind(this))
    cluster.on('error', this.onError.bind(this))
    cluster.on('listening', this.onListening.bind(this))
    cluster.on('online', this.onOnline.bind(this))
    for (let i = 0; i < this.workerCount; i++) {
      cluster.fork()
    }
    this.statTimer = setInterval(this.printState.bind(this), 60000)
  }

  public async stop (): Promise<void> {
    this.logger.debug('Stopping primary runner')
    this.isShuttingDown = true
    this.statTimer && clearInterval(this.statTimer)
    this.workerRestartTimers.forEach(timer => clearTimeout(timer))

    cluster.removeAllListeners()

    const promises = []
    for (const workerId in cluster.workers) {
      const worker = cluster.workers[workerId] as Worker
      promises.push(new Promise((resolve, reject) => {
        this.logger.debug('sending shutdown signal to worker', workerId)

        const killTimer = setTimeout(() => {
          this.logger.warn('Worker did not shutdown in time, killing it')
          process.kill(worker.process.pid as number)
          resolve()
        }, 10000)

        worker.on('disconnect', () => {
          clearTimeout(killTimer)
          this.logger.debug('Worker exited')
          resolve()
        })
        worker.send('shutdown', (err) => {
          if (err) {
            this.logger.error('Error sending shutdown signal to worker', err)
          }
        })
      }) as Promise<void>)
    }
    await Promise.all(promises)
  }

  private printState () {
    for (const workerId in cluster.workers) {
      const worker = cluster.workers[workerId]
      this.logger.trace(`Worker ${workerId}, pid = ${worker?.process.pid} is ${worker?.isDead() ? 'dead' : 'alive'}`)
    }
  }
}
