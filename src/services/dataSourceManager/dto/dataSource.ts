import { IDataSourceCredentials } from '../dao/dataSource'

export interface DataSourceDTO {
    id: string;
    type: string;
    method?: string;
    name: string;
    uri: string;
    tags: string[];
    credentials?: IDataSourceCredentials;
    hasCredentials: boolean;
}
