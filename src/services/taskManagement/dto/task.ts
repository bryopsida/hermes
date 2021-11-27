export interface TaskDTO {
    id: number;
    cron: string;
    name: string;
    description?: string;
    task_params?: unknown;
}