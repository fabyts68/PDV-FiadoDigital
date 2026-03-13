export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export type PaginatedResponse<T> = ApiResponse<PaginatedResult<T>>;
