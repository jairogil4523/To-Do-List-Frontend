export interface PaginationRequest {
  page: number;
  size: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface PaginationConfig {
  pageSizeOptions: number[];
  defaultPageSize: number;
  showFirstLastButtons: boolean;
}