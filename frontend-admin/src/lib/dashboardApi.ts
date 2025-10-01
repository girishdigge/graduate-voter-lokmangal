import api from './api';
import type { DashboardStats, RecentVoter } from '../types/dashboard';

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  // Get recent voters for activity feed
  getRecentVoters: async (limit: number = 10): Promise<RecentVoter[]> => {
    const response = await api.get('/admin/voters', {
      params: {
        page: 1,
        limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      },
    });
    return response.data.data.voters;
  },

  // Get recently verified voters
  getRecentlyVerified: async (limit: number = 5): Promise<RecentVoter[]> => {
    const response = await api.get('/admin/voters', {
      params: {
        page: 1,
        limit,
        verification_status: 'verified',
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
    });
    return response.data.data.voters;
  },
};
