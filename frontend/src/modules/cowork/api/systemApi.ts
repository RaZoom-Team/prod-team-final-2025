import { apiRequest } from './apiClient';

export interface SettingsDTO {
  accent_color: string;
  application_name: string;
  logo_id: string;
}

export interface KeyValueDTO {
  accent_color?: string;
  application_name?: string;
  logo_id?: string;
}

/**
 * Ping the system to check if it's alive
 * @returns True if the system is alive
 */
export const pingSystem = async (): Promise<boolean> => {
  try {
    return await apiRequest<boolean>({
      url: '/system/ping',
      method: 'GET',
    });
  } catch (error) {
    console.error('Error pinging system:', error);
    return false;
  }
};

/**
 * Get system settings
 * @returns System settings
 */
export const getSystemSettings = async (): Promise<SettingsDTO> => {
  try {
    return await apiRequest<SettingsDTO>({
      url: '/system/settings',
      method: 'GET',
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    throw error;
  }
};

/**
 * Update system settings
 * @param settings - Settings to update
 * @returns Updated settings
 */
export const updateSystemSettings = async (settings: KeyValueDTO): Promise<SettingsDTO> => {
  try {
    return await apiRequest<SettingsDTO>({
      url: '/system/settings',
      method: 'PATCH',
      data: settings,
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};