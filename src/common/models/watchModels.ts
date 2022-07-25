export interface IUnprocesseedJsonData {
    jobId: string;
    sourceQueue: string;
    timestamp: number;
    data: unknown;
}
export interface IProcessedJsonData extends IUnprocesseedJsonData {
    metadata: Record<string, Array<unknown>>;
}
export interface IQuery {
    query: string;
    queryEngine: string;
    watchId: number;
}
export interface IJsonWatchResult extends IProcessedJsonData {
    matchedQueries: Array<IQuery>;
    matched: boolean;
}
