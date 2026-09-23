import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, removeAuthToken } from './utils/api';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'district_manager' 
  | 'regional_manager' 
  | 'admin_operation' 
  | 'admin_hrm' 
  | 'district_incident_reporter'
  | 'station_manager'
  | 'station_worker';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  stationId?: string;
  stationName?: string;
  region?: string;
  district?: string;
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolePermissions: Record<UserRole, string[]> = {
  // Super Admin - Full system access - explicitly includes ALL permissions
  super_admin: [
    '*', // Wildcard for all permissions
    'manage_users', // Explicit full user management
    'manage_unions', // Explicit union management
    'manage_claims', // Explicit claims management
    'view_death_traps', // Explicit death trap access
    'create_death_trap_reports', // Explicit death trap creation
    'manage_vehicles', // Explicit vehicle management
    'manage_drivers', // Explicit driver management
    'manage_stations', // Explicit station management
    'manage_trips', // Explicit trip management
    'manage_passengers', // Explicit passenger management
    'view_reports', // Explicit reports access
    'view_revenue', // Explicit revenue access
    'view_tickets', // Explicit tickets access
    'manage_incidents', // Explicit incident management
    'view_ratings_complaints', // Explicit ratings access
    'manage_basic_users', // Explicit basic user management
    'view_dashboard', // Explicit dashboard access
    'view_station_reports' // Explicit station reports
  ], // Super admin has explicit access to everything
  
  // Regular Admin - Most permissions but with some restrictions
  admin: [
    'view_dashboard', 
    'manage_stations',           // ✓ Full access to station management
    'manage_vehicles', 
    'manage_drivers', 
    'manage_trips', 
    'manage_passengers', 
    'view_reports', 
    'view_revenue', 
    'view_tickets',              // ✓ Full access to passenger tickets
    'manage_incidents',          // ✓ Full access to incident management  
    'view_ratings_complaints',   // ✓ Full access to ratings & complaints
    'manage_basic_users'         // Can manage non-admin users only
    // Removed: manage_users (full user management), manage_unions, manage_claims, view_death_traps
  ],
  
  // Regional Manager - Regional scope permissions
  regional_manager: [
    'view_dashboard', 
    'manage_stations', 
    'manage_vehicles', 
    'manage_drivers',
    'manage_trips', 
    'view_reports', 
    'view_revenue', 
    'manage_incidents',
    'view_death_traps', 
    'manage_unions' // Can manage unions at regional level
  ],
  
  // District Manager - District scope permissions
  district_manager: [
    'view_dashboard', 
    'manage_stations', 
    'manage_vehicles', 
    'manage_drivers',
    'manage_trips', 
    'view_reports', 
    'manage_incidents', 
    'view_death_traps'
  ],
  
  // Operations Admin - Operations focused
  admin_operation: [
    'view_dashboard', 
    'manage_trips', 
    'manage_vehicles', 
    'manage_drivers',
    'view_reports', 
    'manage_incidents'
  ],
  
  // HR Admin - Human resources focused
  admin_hrm: [
    'view_dashboard', 
    'manage_basic_users', // Can manage basic users
    'manage_drivers', 
    'view_reports',
    'manage_unions'
  ],
  
  // Incident Reporter - Incident and safety focused
  district_incident_reporter: [
    'view_dashboard', 
    'manage_incidents', 
    'manage_claims', 
    'view_death_traps',
    'create_death_trap_reports',
    'view_reports' // Added for accident analysis access
  ],
  
  // Station Manager - Station-scoped leadership (fleet, staff, operations)
  station_manager: [
    'view_dashboard',
    'manage_trips',
    'manage_passengers',
    'view_tickets',
    'view_station_reports',
    'manage_vehicles',
    'manage_drivers',
    'manage_basic_users',
    'view_reports',
  ],

  // Station Worker - Station-scoped operations
  station_worker: [
    'view_dashboard',
    'manage_trips',
    'manage_passengers',
    'view_tickets',
    'view_station_reports',
  ],
};

function normalizeRole(role: string): UserRole {
  const normalized = role?.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (normalized === 'worker') return 'station_worker';
  if (normalized === 'station_manager' || normalized === 'stationmanager') return 'station_manager';
  if (normalized in rolePermissions) return normalized as UserRole;
  return role as UserRole;
}

function mergePermissions(role: UserRole, backendPermissions: string[] = []): string[] {
  const defaults = rolePermissions[role] || [];
  return [...new Set([...defaults, ...backendPermissions])];
}

function buildUserFromAuth(
  partial: Omit<User, 'permissions'> & { permissions?: string[] }
): User {
  const role = normalizeRole(partial.role);
  return {
    ...partial,
    role,
    permissions: mergePermissions(role, partial.permissions),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('rise-auth');
    if (storedAuth) {
      try {
        const { isAuthenticated: stored, user: storedUser } = JSON.parse(storedAuth);
        if (stored && storedUser) {
          const userData = buildUserFromAuth(storedUser);
          setIsAuthenticated(true);
          setUser(userData);
          localStorage.setItem(
            'rise-auth',
            JSON.stringify({ isAuthenticated: true, user: userData })
          );
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('rise-auth');
      }
    }
  }, []);

  const persistSession = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem(
      'rise-auth',
      JSON.stringify({ isAuthenticated: true, user: userData })
    );
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(username, password);

      if (response.success && response.data) {
        const userData = buildUserFromAuth({
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          fullName: response.data.user.fullName,
          role: response.data.user.role,
          stationId: response.data.user.stationId,
          stationName: response.data.user.stationName,
          region: response.data.user.region,
          district: response.data.user.district,
          permissions: response.data.user.permissions,
        });

        persistSession(userData);
        return true;
      }

      console.error('Login failed:', response.error);
      return false;
    } catch (error) {
      console.error('Login exception:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('rise-auth');
      removeAuthToken();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return user.permissions.includes(permission);
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin';
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      hasPermission,
      isSuperAdmin,
      isAdmin
    }}>
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