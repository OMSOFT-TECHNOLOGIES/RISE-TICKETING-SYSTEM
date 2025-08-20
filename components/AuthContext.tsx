import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'district_manager' 
  | 'regional_manager' 
  | 'admin_operation' 
  | 'admin_hrm' 
  | 'district_incident_reporter' 
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
  logout: () => void;
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
  
  // Station Worker - Limited to station operations
  station_worker: [
    'view_dashboard', 
    'manage_trips', 
    'manage_passengers', 
    'view_station_reports'
  ]
};

// Mock users with updated role structure
const mockUsers: User[] = [
  {
    id: '1',
    username: 'superadmin',
    email: 'superadmin@rise.gov.gh',
    fullName: 'Super Administrator',
    role: 'super_admin',
    permissions: rolePermissions.super_admin
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@rise.gov.gh',
    fullName: 'System Administrator',
    role: 'admin',
    permissions: rolePermissions.admin
  },
  {
    id: '3',
    username: 'rmgr_ashanti',
    email: 'regional.ashanti@rise.gov.gh',
    fullName: 'Kwame Asante',
    role: 'regional_manager',
    region: 'Ashanti',
    permissions: rolePermissions.regional_manager
  },
  {
    id: '4',
    username: 'dmgr_kumasi',
    email: 'district.kumasi@rise.gov.gh',
    fullName: 'Akosua Mensah',
    role: 'district_manager',
    region: 'Ashanti',
    district: 'Kumasi',
    permissions: rolePermissions.district_manager
  },
  {
    id: '5',
    username: 'ops_admin',
    email: 'operations@rise.gov.gh',
    fullName: 'Yaw Boateng',
    role: 'admin_operation',
    permissions: rolePermissions.admin_operation
  },
  {
    id: '6',
    username: 'hr_admin',
    email: 'hr@rise.gov.gh',
    fullName: 'Ama Owusu',
    role: 'admin_hrm',
    permissions: rolePermissions.admin_hrm
  },
  {
    id: '7',
    username: 'incident_reporter',
    email: 'incidents.accra@rise.gov.gh',
    fullName: 'Kojo Asamoah',
    role: 'district_incident_reporter',
    region: 'Greater Accra',
    district: 'Accra',
    permissions: rolePermissions.district_incident_reporter
  },
  {
    id: '8',
    username: 'worker',
    email: 'worker.station1@rise.gov.gh',
    fullName: 'Adwoa Adjei',
    role: 'station_worker',
    stationId: 'ST001',
    stationName: 'Accra Central Station',
    permissions: rolePermissions.station_worker
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('rise-auth');
    if (storedAuth) {
      try {
        const { isAuthenticated: stored, user: storedUser } = JSON.parse(storedAuth);
        if (stored && storedUser) {
          setIsAuthenticated(true);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
        localStorage.removeItem('rise-auth');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple authentication - in production, this would be handled by backend
    const foundUser = mockUsers.find(u => u.username === username);
    
    if (foundUser && password === 'password') {
      setIsAuthenticated(true);
      setUser(foundUser);
      
      // Store authentication state
      localStorage.setItem('rise-auth', JSON.stringify({
        isAuthenticated: true,
        user: foundUser
      }));
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('rise-auth');
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