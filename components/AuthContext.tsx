import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stationId?: string;
  stationName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: Record<string, User & { password: string }> = {
  'admin@rise.gov.gh': {
    id: '1',
    name: 'Kwame Asante',
    email: 'admin@rise.gov.gh',
    role: 'admin',
    password: 'admin123'
  },
  'worker@accra.rise.gov.gh': {
    id: '2',
    name: 'Ama Osei',
    email: 'worker@accra.rise.gov.gh',
    role: 'worker',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    password: 'worker123'
  },
  'worker@kumasi.rise.gov.gh': {
    id: '3',
    name: 'Kofi Mensah',
    email: 'worker@kumasi.rise.gov.gh',
    role: 'worker',
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    password: 'worker123'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const userData = mockUsers[email];
    if (userData && userData.password === password) {
      const { password: _, ...userWithoutPassword } = userData;
      setUser(userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}