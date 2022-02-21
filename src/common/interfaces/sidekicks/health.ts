import { IService } from '../service'

export interface IHealthSidekick {
  registerService(service: IService): void;
  unregisterService(service: IService): void;
  isAlive(): Promise<boolean>;
  canServeTraffic(): Promise<boolean>;
}
