import { createContext } from 'react';

interface User {
  id: string;
  aadharNumber: string;
  fullName: string;
  contact: string;
  email?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (aadharNumber: string) => Promise<{ exists: boolean; user?: User }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export type { User, AuthContextType };
