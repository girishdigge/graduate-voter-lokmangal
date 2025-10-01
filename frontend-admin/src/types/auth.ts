export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager';
  fullName: string;
  isActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: AdminUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AdminUser;
    token: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
