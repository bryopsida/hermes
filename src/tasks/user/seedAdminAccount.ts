import { Job, Queue } from 'bull'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import createLogger from '../../common/logger/factory'
import { BaseTask } from '../baseTask'
import { User } from '../../services/user/dao/user'

export class SeedAdminUserTask extends BaseTask {
  public static readonly ID = 'seed-admin-user'
  public id: string = SeedAdminUserTask.ID
  protected readonly log = createLogger({
    serviceName: `seed-admin-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  public constructor (queue: Queue) {
    super(queue, SeedAdminUserTask.ID)
  }

  private async hasSeedAlreadyOccurred (): Promise<boolean> {
    const job = await this.queue.getJob(this.id)
    return job != null
  }

  /**
   * Checks if the job should be added to the queue
   * @returns true if the job should be added to the work queue
   */
  protected override async shouldBeQueued (): Promise<boolean> {
    return !(await this.hasSeedAlreadyOccurred())
  }

  /**
   * Creates the initial admin accounnt with the provided credentials
   * @param userAccount admin user name
   * @param password admin password, will be hashed with argon2
   */
  private async createAdminUser (userAccount: string, password: string): Promise<void> {
    this.log.debug('Creating admin user account')
    const adminUser = await User.build(userAccount, 'admin@localhost', password, ['admin'])
    await User.upsert(adminUser)
    this.log.debug('Created admin user account')
  }

  /**
   * Seeds the admin account if the seed job hasn't already run
   * @param job Bull Job Context
   * @returns Promise<void>
   */
  async processJob (job: Job<any>): Promise<unknown> {
    const executeSeed = process.env.SEED_ADMIN_ACCOUNT === 'true'
    if (!executeSeed) {
      this.logToJob('Seeding is not enabled, ignoring', job)
      return Promise.resolve()
    }
    if (await this.hasSeedAlreadyOccurred()) {
      this.logToJob('Seed already occurred, ignoring', job)
      return Promise.resolve()
    }
    const adminUserAccount = process.env.INITIAL_ADMIN_USER_ACCOUNT
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD
    if (!adminUserAccount || !adminPassword) {
      this.logToJob('Admin account information not found!', job)
      return Promise.reject(new Error('Admin account information not found!'))
    }
    await this.createAdminUser(adminUserAccount, adminPassword)
  }
}
