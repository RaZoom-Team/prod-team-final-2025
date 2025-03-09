import { User, UserRole } from '../types';
import { API_BASE_URL } from '../../../config';
import { getAuthToken, removeAuthToken } from './authApi';
import { apiRequest } from '../../cowork/api/apiClient';

export interface ClientDTO {
  id: number;
  name: string;
  email: string;
  access_level: number;
}

const mapAccessLevelToRole = (accessLevel: number): UserRole => {
  switch (accessLevel) {
    case 2:
      return 'owner';
    case 1:
      return 'admin';
    default:
      return 'user';
  }
};

const apiClientToUser = (client: ClientDTO): User => {
  return {
    id: client.id.toString(),
    name: client.name,
    email: client.email,
    role: mapAccessLevelToRole(client.access_level),
    organizationId: client.access_level > 0 ? '1' : undefined
  };
};

let currentUser: User | null = null;

export const getCurrentUser = async (): Promise<User | null> => {
  try {

    const token = getAuthToken();
    if (!token) return null;
    
    const userData = await apiRequest<ClientDTO>({
      url: '/clients/@me',
      method: 'GET',
    });
    
    const user = apiClientToUser(userData);
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.warn('Failed to fetch user data:', error);

    removeAuthToken();
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: { name: string }): Promise<User> => {
  try {
    const updatedUser = await apiRequest<ClientDTO>({
      url: `/clients/${userId}`,
      method: 'PATCH',
      data: { 
        name: data.name
      },
    });
    
    const user = apiClientToUser(updatedUser);
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
  
    if ((error as any).statusCode === 401 || (error as any).statusCode === 403) {
      removeAuthToken();
      localStorage.removeItem('currentUser');
      currentUser = null;
      
      window.location.href = '/login';
      throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
    }
    
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  currentUser = null;
  removeAuthToken();
  localStorage.removeItem('currentUser');

  window.location.href = '/login';
};

export const getAdmins = async (): Promise<User[]> => {
  try {
    const admins = await apiRequest<ClientDTO[]>({
      url: '/admin',
      method: 'GET',
    });
    
    return admins.map(apiClientToUser);
  } catch (error) {
    console.error('Error fetching admins:', error);
    
    // Check if it's an auth issue
    if ((error as any).statusCode === 401 || (error as any).statusCode === 403) {
      removeAuthToken();
      localStorage.removeItem('currentUser');
      currentUser = null;
      
      // Redirect to login page
      window.location.href = '/login';
      throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
    }
    
    throw error;
  }
};

export const removeAdmin = async (id: string): Promise<void> => {
  try {
    await apiRequest({
      url: `/admin/${id}`,
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error removing admin:', error);
    
    if ((error as any).statusCode === 401 || (error as any).statusCode === 403) {
      removeAuthToken();
      localStorage.removeItem('currentUser');
      currentUser = null;
      
      window.location.href = '/login';
      throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
    }
    
    throw error;
  }
};