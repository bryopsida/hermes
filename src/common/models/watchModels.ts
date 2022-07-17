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
    metadata: Map<string, unknown>;
}

export interface IJsonWatchResult {
    data: unknown;
    matchedQueries: Array<IGraphQuery>;
    matched: boolean;
    processTimestamp: number;
    metadata: Map<string, unknown>;
}
