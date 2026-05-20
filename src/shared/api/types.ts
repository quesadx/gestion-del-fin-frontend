export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

export interface SystemTimeResponse {
  now: string;
  iso: string;
  today: string;
}

export type PersonStatus = 'SICK' | 'HEALTHY' | 'INJURED' | 'AWAY' | 'DEAD';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
