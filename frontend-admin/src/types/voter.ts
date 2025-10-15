export interface Voter {
  id: string;
  aadharNumber: string;
  fullName: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  guardianSpouse?: string;
  qualification?: string;
  occupation?: string;
  contact: string;
  email?: string;
  dateOfBirth: string;
  age: number;

  // Address Information
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;

  // Elector Information
  isRegisteredElector: boolean;
  assemblyNumber?: string;
  assemblyName?: string;
  pollingStationNumber?: string;
  epicNumber?: string;
  disabilities?: string;

  // Education Information
  university?: string;
  graduationYear?: number;
  graduationDocType?: string;

  // Verification Status
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relations
  documents?: VoterDocument[];
  references?: VoterReference[];
  verifiedByAdmin?: {
    id: string;
    fullName: string;
  };
}

export interface VoterDocument {
  id: string;
  documentType: 'AADHAR' | 'DEGREE_CERTIFICATE' | 'PHOTO';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface VoterReference {
  id: string;
  referenceName: string;
  referenceContact: string;
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
  whatsappSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VotersListResponse {
  data: {
    voters: Voter[];
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

export interface VoterFilters {
  verification_status?: 'verified' | 'unverified';
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  assembly_number?: string;
  polling_station_number?: string;
  city?: string;
  state?: string;
  age_min?: number;
  age_max?: number;
}

export interface VoterSortOptions {
  sort_by?:
    | 'created_at'
    | 'updated_at'
    | 'full_name'
    | 'age'
    | 'assembly_number';
  sort_order?: 'asc' | 'desc';
}

export interface VoterSearchParams extends VoterFilters, VoterSortOptions {
  q?: string;
  page?: number;
  limit?: number;
}

export interface VoterUpdateData {
  fullName?: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  guardianSpouse?: string;
  qualification?: string;
  occupation?: string;
  dateOfBirth?: string;
  contact?: string;
  email?: string;
  houseNumber?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isRegisteredElector?: boolean;
  assemblyNumber?: string;
  assemblyName?: string;
  pollingStationNumber?: string;
  epicNumber?: string;
  disabilities?: string;
  university?: string;
  graduationYear?: number;
  graduationDocType?: string;
}
