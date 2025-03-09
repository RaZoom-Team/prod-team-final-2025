import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../../../config';
import { getAuthToken, removeAuthToken } from '../../user/api/authApi';
import { HTTPErrorModel, HTTPValidationErrorModel } from './types';

/**
 * Creates and configures an Axios instance for API requests
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor to add auth token
  client.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<HTTPErrorModel | HTTPValidationErrorModel>) => {
      // Check if error is due to authentication issues
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Log out the user by removing token and user data
        removeAuthToken();
        localStorage.removeItem('currentUser');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Extract error message from API response if available
      const errorMessage = error.response?.data?.message || error.message;
      
      // Create a new error with the API message
      const enhancedError = new Error(errorMessage);
      
      // Add the original error data for debugging
      (enhancedError as any).originalError = error;
      (enhancedError as any).statusCode = error.response?.status;
      
      return Promise.reject(enhancedError);
    }
  );

  return client;
};

// Create a singleton instance
const apiClient = createApiClient();

/**
 * Generic API request function with type safety
 */
export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default apiClient;