export interface UserActivityRecord {
  id: string;
  fullName: string;
  username: string;
  role: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | string;
  isOnline: boolean;
  lastSeen: string | null;
  lastLogin: string | null;
  lastLogout: string | null;
}

export interface UserActivitySummary {
  activeUsers: number;
  totalTracked: number;
  users: UserActivityRecord[];
}
