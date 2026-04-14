export interface ApiSuccess<T> {
  ok: true;
  data: T;
  cachedAt?: string;
}

export interface ApiError {
  ok: false;
  error: string;
  code: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
