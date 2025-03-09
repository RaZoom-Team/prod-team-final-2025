export type UserRole = 'user' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
}