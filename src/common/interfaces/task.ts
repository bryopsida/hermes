export interface ITask {
  id: string;
  stop(): Promise<void>;
}