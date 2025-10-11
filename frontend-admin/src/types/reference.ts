export interface Reference {
  id: string;
  referenceName: string;
  referenceContact: string;
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  statusUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    contact?: string;
    aadharNumber?: string;
  };
}

export interface ReferencesListResponse {
  data: {
    references: Reference[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ReferenceFilters {
  status?: 'PENDING' | 'CONTACTED' | 'APPLIED';
}

export interface ReferenceSortOptions {
  sort_by?: 'created_at' | 'updated_at' | 'reference_name';
  sort_order?: 'asc' | 'desc';
}

export interface ReferenceSearchParams
  extends ReferenceFilters,
    ReferenceSortOptions {
  q?: string;
  page?: number;
  limit?: number;
}

export interface ReferenceUpdateData {
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
}

export interface BulkReferenceUpdateData {
  referenceIds: string[];
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
}
