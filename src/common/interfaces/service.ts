export interface IService {
    start(): Promise<void>;
    stop(): Promise<void>;
    destroy(): Promise<void>;
    isAlive(): Promise<boolean>;
    canServeTraffic(): Promise<boolean>;
    servesTraffic(): boolean;
    readonly ID: string;
    readonly ORDER: number;
}
