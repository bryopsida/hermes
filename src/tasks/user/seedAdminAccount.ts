import { Job } from 'bull'
import COMPUTED_CONSTANTS from '../../common/computedConstants'
import createLogger from '../../common/logger/factory'
import { BaseTask } from '../baseTask'

export class SeedAdminUserTask extends BaseTask {
  public static readonly ID = 'seed-admin-user'
  public id: string = SeedAdminUserTask.ID
  protected readonly log = createLogger({
    serviceName: `seed-admin-task-${COMPUTED_CONSTANTS.id}`,
    level: 'debug'
  })

  processJob (job: Job<any>): Promise<unknown> {
    throw new Error('Method not implemented.')
  }
}
