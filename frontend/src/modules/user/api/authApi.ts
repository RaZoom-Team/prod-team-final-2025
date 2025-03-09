import { API_BASE_URL } from '../../../config';
import { User, UserRole } from '../types';
import { apiRequest } from '../../cowork/api/apiClient';

// Types based on the Swagger documentation
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateClientDTO {
  name: string;
  email: string;
  password: string;
}

export interface CreateAdminDTO {
  email: string;
  access_level?: number;
}

export interface AuthResponse {
  token: string;
}

export interface ClientDTO {
  id: number;
  name: string;
  email: string;
  access_level: number;
}

export interface HTTPValidationErrorModel {
  error_code: number;
  http_code: number;
  message: string;
  detail: any[] | null;
}

// Map access_level to UserRole
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

// Convert ClientDTO to User
const clientDtoToUser = (client: ClientDTO): User => {
  return {
    id: client.id.toString(),
    name: client.name,
    email: client.email,
    role: mapAccessLevelToRole(client.access_level),
    organizationId: client.access_level > 0 ? '1' : undefined
  };
};

// Set token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Get token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Remove token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Login user
export const loginUser = async (credentials: LoginRequest): Promise<{ token: string, user: User }> => {
  try {
    const authData = await apiRequest<AuthResponse>({
      url: '/auth/login',
      method: 'POST',
      data: credentials,
    });
    
    // Store token in localStorage
    setAuthToken(authData.token);
    
    // Get user data
    const userData = await getCurrentUserFromAPI(authData.token);
    
    // Store user data in localStorage for easy access
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    return { token: authData.token, user: userData };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Произошла ошибка при авторизации');
  }
};

// Register user
export const registerUser = async (data: CreateClientDTO): Promise<{ token: string, user: User }> => {
  try {
    const authData = await apiRequest<AuthResponse>({
      url: '/auth/register',
      method: 'POST',
      data,
    });
    
    // Store token in localStorage
    setAuthToken(authData.token);
    
    // Get user data
    const userData = await getCurrentUserFromAPI(authData.token);
    
    // Store user data in localStorage for easy access
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    return { token: authData.token, user: userData };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Произошла ошибка при регистрации');
  }
};

// Get current user from API
const getCurrentUserFromAPI = async (token: string): Promise<User> => {
  try {
    const clientData = await apiRequest<ClientDTO>({
      url: '/clients/@me',
      method: 'GET',
      headers: {
        'Authorization': token,
      },
    });
    
    return clientDtoToUser(clientData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    // If there's any error, log out the user
    removeAuthToken();
    localStorage.removeItem('currentUser');
    
    // Redirect to login page if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    throw error;
  }
};

// Add admin user
export const addAdminUser = async (data: CreateAdminDTO): Promise<void> => {
  try {
    await apiRequest({
      url: '/admin',
      method: 'POST',
      data: {
        email: data.email,
        access_level: data.access_level || 1 // Default to admin level
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Произошла ошибка при добавлении администратора');
  }
};

// Get current user from token
export const getCurrentUserFromToken = async (): Promise<User | null> => {
  const token = getAuthToken();
  const userJson = localStorage.getItem('currentUser');
  
  if (!token) {
    return null;
  }
  
  try {
    // If we have user data in localStorage, use it
    if (userJson) {
      return JSON.parse(userJson);
    }
    
    // Otherwise, fetch user data from API
    return await getCurrentUserFromAPI(token);
  } catch (error) {
    // If there's an error, clear auth data
    removeAuthToken();
    localStorage.removeItem('currentUser');
    
    // Redirect to login page if not already there
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    return null;
  }
};

// Logout user - simplified to just remove token without API call
export const logoutUser = async (): Promise<void> => {
  // Simply remove the token and user data
  removeAuthToken();
  localStorage.removeItem('currentUser');
  
  // Redirect to login page
  window.location.href = '/login';
};