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
    role: 'system_admin' | 'resource_manager' | 'worker' | 'travel_lead';
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
