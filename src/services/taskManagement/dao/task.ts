import { TaskDTO } from '../dto/task';
import knex from '../knex';

const tableName = 'tasks';

export interface ITask {
    id: number;
    cron: string;
    name: string;
    description?: string;
    task_params?: unknown;
}

export class Task implements ITask {

    id: number;
    cron: string;
    name: string;
    description?: string;
    task_params?: unknown; 

    constructor(dataSource: ITask | null = null) {
        if (dataSource) {
            this.id = dataSource.id;
            this.cron = dataSource.cron;
            this.name = dataSource.name;
            this.description = dataSource.description;
            this.task_params = dataSource.task_params;
        } else {
            this.id = 0;
            this.cron = '';
            this.name = '';
            this.description = '';
        }
    }


    static async findAll(offset: number, count: number): Promise<Array<Task>> {
        return (await knex).from(tableName).select('*').offset(offset).limit(count).then(function(rows) {
            return rows.map(row => {
                return new Task(row);
            });
        });
    }

    static async upsert(dataSource: ITask): Promise<ITask> {
        return (await knex).raw(
            `? ON CONFLICT (id)
                    DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    cron = EXCLUDED.cron,
                    taskParams = EXCLUDED.taskParams
                  RETURNING *;`,
            [(await knex)(tableName).insert(dataSource)],
          );
    }

    static async has(id: number) : Promise<boolean> {
        return (await knex).from(tableName).where({ id }).count('* as count').then(function(rows) {
            return rows.length > 0;
        });
    }

    static async delete(id: number): Promise<void>  {
        await (await knex).delete().from(tableName).where({ id });
    }
    
    toDTO(): TaskDTO {
        return {
            id: this.id,
            cron: this.cron,
            name: this.name,
            description: this.description,
            task_params: this.task_params
        };
    }

    static fromDTO(dto: TaskDTO): ITask {
        return new Task(dto);
    }
}