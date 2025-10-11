export interface Manager {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    verifiedUsers: number;
    auditLogs: number;
  };
}

export interface ManagerFilters {
  page: number;
  limit: number;
  search: string;
  role?: 'ADMIN' | 'MANAGER';
  isActive?: boolean;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface CreateManagerData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: 'ADMIN' | 'MANAGER';
}

export interface UpdateManagerData {
  email: string;
  fullName: string;
  isActive: boolean;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface ManagerResponse {
  success: boolean;
  data?: Manager;
  error?: {
    code: string;
    message: string;
  };
}

export interface ManagerListResponse {
  success: boolean;
  data: {
    managers: Manager[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
