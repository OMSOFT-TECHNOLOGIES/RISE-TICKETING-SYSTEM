export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    phone?: string;
    stationId?: string;
    stationName?: string;
    region?: string;
    district?: string;
    permissions: string[];
  };
}
