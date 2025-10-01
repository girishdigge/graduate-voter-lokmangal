export interface DashboardStats {
  voters: {
    total: number;
    verified: number;
    unverified: number;
    verificationRate: number;
    recentEnrollments: number;
  };
  references: {
    total: number;
    pending: number;
    contacted: number;
    applied: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'verification' | 'reference_update';
  description: string;
  timestamp: string;
  user?: {
    id: string;
    fullName: string;
    aadharNumber: string;
  };
  admin?: {
    id: string;
    fullName: string;
  };
}

export interface RecentVoter {
  id: string;
  fullName: string;
  aadharNumber: string;
  contact: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  city?: string;
  assemblyNumber?: string;
}
