export interface DataSourceDTO {
    id: number;
    type: string;
    name: string;
    uri: string;
    tags: Array<string>;
}