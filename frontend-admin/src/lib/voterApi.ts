import api from './api';
import type {
  Voter,
  VotersListResponse,
  VoterSearchParams,
  VoterUpdateData,
} from '../types/voter';

export const voterApi = {
  // Get paginated list of voters with search and filtering
  getVoters: async (
    params: VoterSearchParams = {}
  ): Promise<VotersListResponse> => {
    const response = await api.get('/admin/voters', { params });
    return response.data;
  },

  // Get detailed voter information
  getVoterDetails: async (
    userId: string
  ): Promise<{ data: { user: Voter } }> => {
    const response = await api.get(`/admin/voters/${userId}`);
    return response.data;
  },

  // Verify or unverify a voter
  verifyVoter: async (
    userId: string,
    isVerified: boolean
  ): Promise<{ data: { user: Voter } }> => {
    const response = await api.put(`/admin/voters/${userId}/verify`, {
      isVerified,
    });
    return response.data;
  },

  // Update voter information
  updateVoter: async (
    userId: string,
    updateData: VoterUpdateData
  ): Promise<{ data: { user: Voter } }> => {
    const response = await api.put(`/admin/voters/${userId}`, updateData);
    return response.data;
  },

  // Search voters using Elasticsearch
  searchVoters: async (
    query: string,
    filters: VoterSearchParams = {}
  ): Promise<VotersListResponse> => {
    const params = { q: query, ...filters };
    const response = await api.get('/admin/search/voters', { params });
    return response.data;
  },
};
