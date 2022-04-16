export interface IUnprocesseedJsonData {
    jobId: string;
    sourceQueue: string;
    timestamp: number;
    data: unknown;
}
export interface IGraphQuery {
    query: string;
    watchId: number;
}
export interface IWatchedJsonData {
    graphQueries: Array<IGraphQuery>;
    sourceUri: string;
    fetchTimestamp: number;
    data: unknown;
}

export interface IJsonWatchResult {
    data: unknown;
    matchedQueries: Array<IGraphQuery>;
    matched: boolean;
    processTimestamp: number;
}
