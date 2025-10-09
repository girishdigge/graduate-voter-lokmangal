import api from './api';
import type {
  Reference,
  ReferencesListResponse,
  ReferenceSearchParams,
  ReferenceUpdateData,
  BulkReferenceUpdateData,
} from '../types/reference';

export const referenceApi = {
  // Get paginated list of references with search and filtering
  getReferences: async (
    params: ReferenceSearchParams = {}
  ): Promise<ReferencesListResponse> => {
    const response = await api.get('/admin/references', { params });
    return response.data;
  },

  // Add references for a user
  addReferences: async (
    userId: string,
    references: { referenceName: string; referenceContact: string }[]
  ): Promise<{ data: { references: Reference[]; message: string } }> => {
    const response = await api.post(`/references/${userId}`, { references });
    return response.data;
  },

  // Search references using Elasticsearch
  searchReferences: async (
    query: string,
    filters: ReferenceSearchParams = {}
  ): Promise<ReferencesListResponse> => {
    const params = { q: query, ...filters };
    const response = await api.get('/admin/search/references', { params });
    return response.data;
  },

  // Update reference status
  updateReferenceStatus: async (
    referenceId: string,
    updateData: ReferenceUpdateData
  ): Promise<{ data: { reference: Reference } }> => {
    const response = await api.put(
      `/admin/references/${referenceId}`,
      updateData
    );
    return response.data;
  },

  // Bulk update reference status (custom implementation)
  bulkUpdateReferenceStatus: async (
    updateData: BulkReferenceUpdateData
  ): Promise<{ data: { updatedCount: number; references: Reference[] } }> => {
    // Since the backend doesn't have a bulk update endpoint, we'll update them one by one
    const updatePromises = updateData.referenceIds.map(referenceId =>
      referenceApi.updateReferenceStatus(referenceId, {
        status: updateData.status,
      })
    );

    const results = await Promise.all(updatePromises);
    const references = results.map(result => result.data.reference);

    return {
      data: {
        updatedCount: references.length,
        references,
      },
    };
  },
};
