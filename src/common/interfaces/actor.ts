export interface IActor<T, R> {
    readonly name: string;
    readonly topic: string;
    actOn(message: T): Promise<R>;
    startProcessing(): Promise<void>;
    stopProcessing(): Promise<void>;
}