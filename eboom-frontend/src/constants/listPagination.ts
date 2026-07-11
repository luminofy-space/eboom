export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type ListPageSize = (typeof LIST_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_LIST_PAGE_SIZE: ListPageSize = 20;
