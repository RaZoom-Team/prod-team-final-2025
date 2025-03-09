import { apiRequest } from '../../cowork/api/apiClient';
import { API_BASE_URL } from '../../../config';

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
}

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

// Get organization settings
export const getOrganization = async (): Promise<Organization> => {
  try {
    const settings = await apiRequest<SettingsDTO>({
      url: '/system/settings',
      method: 'GET',
    });
    
    return {
      id: '1', // Default ID since the API doesn't provide one
      name: settings.application_name,
      primaryColor: settings.accent_color,
      logo: settings.logo_id ? `${API_BASE_URL}/files/${settings.logo_id}` : undefined,
    };
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    
    // Fallback to default values if API call fails
    return {
      id: '1',
      name: 'CoworkHub',
      primaryColor: '#4f46e5',
    };
  }
};

// Update organization settings
export const updateOrganization = async (data: Partial<Organization>): Promise<Organization> => {
  try {
    // Prepare data for API
    const updateData: KeyValueDTO = {};
    
    if (data.name) {
      updateData.application_name = data.name;
    }
    
    if (data.primaryColor) {
      updateData.accent_color = data.primaryColor;
    }
    
    if (data.logo) {
      // Extract image ID from logo URL if it's in the format "/files/{id}" or contains "/files/"
      const match = data.logo.match(/\/files\/(.+)$/);
      if (match && match[1]) {
        updateData.logo_id = match[1];
      } else {
        updateData.logo_id = data.logo;
      }
    }
    
    // Update settings via API
    const updatedSettings = await apiRequest<SettingsDTO>({
      url: '/system/settings',
      method: 'PATCH',
      data: updateData,
    });
    
    // Update CSS variable for primary color
    document.documentElement.style.setProperty('--organization-color', updatedSettings.accent_color);
    
    // Return updated organization
    return {
      id: '1', // Default ID since the API doesn't provide one
      name: updatedSettings.application_name,
      primaryColor: updatedSettings.accent_color,
      logo: updatedSettings.logo_id ? `${API_BASE_URL}/files/${updatedSettings.logo_id}` : undefined,
    };
  } catch (error) {
    console.error('Error updating organization settings:', error);
    throw error;
  }
};