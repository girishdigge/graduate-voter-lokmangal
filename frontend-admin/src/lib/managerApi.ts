import api from './api';
import type {
  Manager,
  ManagerFilters,
  CreateManagerData,
  UpdateManagerData,
  PasswordChangeData,
  ManagerResponse,
  ManagerListResponse,
} from '../types/manager';

/**
 * Get paginated list of managers with search and filtering
 */
export const getManagers = async (
  filters: ManagerFilters
): Promise<ManagerListResponse> => {
  const params = new URLSearchParams();

  // Add pagination
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());

  // Add search
  if (filters.search) {
    params.append('search', filters.search);
  }

  // Add filters
  if (filters.role) {
    params.append('role', filters.role);
  }

  if (filters.isActive !== undefined) {
    params.append('isActive', filters.isActive.toString());
  }

  // Add sorting
  params.append('sort_by', filters.sort_by);
  params.append('sort_order', filters.sort_order);

  const response = await api.get<ManagerListResponse>(
    `/admin/managers?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch managers');
  }

  return response.data;
};

/**
 * Get manager by ID
 */
export const getManagerById = async (managerId: string): Promise<Manager> => {
  const response = await api.get<ManagerResponse>(
    `/admin/managers/${managerId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch manager');
  }

  return response.data.data!;
};

/**
 * Create a new manager account
 */
export const createManager = async (
  managerData: CreateManagerData
): Promise<Manager> => {
  const response = await api.post<ManagerResponse>(
    '/admin/managers',
    managerData
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to create manager');
  }

  return response.data.data!;
};

/**
 * Update manager details
 */
export const updateManager = async (
  managerId: string,
  updateData: UpdateManagerData
): Promise<Manager> => {
  const response = await api.put<ManagerResponse>(
    `/admin/managers/${managerId}`,
    updateData
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to update manager');
  }

  return response.data.data!;
};

/**
 * Deactivate manager account
 */
export const deactivateManager = async (
  managerId: string
): Promise<Manager> => {
  const response = await api.delete<ManagerResponse>(
    `/admin/managers/${managerId}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || 'Failed to deactivate manager'
    );
  }

  return response.data.data!;
};

/**
 * Change admin/manager password
 */
export const changePassword = async (
  passwordData: PasswordChangeData
): Promise<void> => {
  const response = await api.put('/admin/password', passwordData);

  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || 'Failed to change password'
    );
  }
};
