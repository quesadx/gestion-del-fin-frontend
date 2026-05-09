export interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    username: string;
  };
  token: string;
}

export interface SystemTimeResponse {
  now: string;
  iso: string;
  today: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
