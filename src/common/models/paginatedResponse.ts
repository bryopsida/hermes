export interface IPaginatedResponse<T> {
    offset: number;
    limit: number;
    totalCount: number;
    items: Array<T>;
}