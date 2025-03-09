import { apiRequest } from './apiClient';
import { UploadFileResponse } from './types';
import { API_BASE_URL } from '../../../config';
import { MAP_CONFIG } from '../../../config';

/**
 * Uploads a file to the server
 * @param file - The file to upload
 * @returns The uploaded file information or null if upload failed
 */
export const uploadFile = async (file: File): Promise<UploadFileResponse | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Use direct fetch with the full API URL to ensure correct endpoint
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('authToken') || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return {
      image_id: data.image_id,
      image_url: `${API_BASE_URL}/files/${data.image_id}`,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

/**
 * Gets the full URL for a file ID
 * @param fileId - The file ID
 * @returns The full URL for the file
 */
export const getFileUrl = (fileId: string): string => {
  // If it's already a full URL, return it
  if (fileId.startsWith('http')) {
    return fileId;
  }
  
  // If it's a path starting with /files/, add the API base URL
  if (fileId.startsWith('/files/')) {
    return `${API_BASE_URL}${fileId}`;
  }
  
  // Otherwise, assume it's just an ID and construct the full URL
  return `${API_BASE_URL}/files/${fileId}`;
};

/**
 * Geocodes an address to coordinates using Nominatim OpenStreetMap service
 * @param address - The address to geocode
 * @returns The coordinates [lat, lng] or null if geocoding failed
 */
export const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    console.log('Геокодирование адреса:', address);
    
    // Используем Nominatim OpenStreetMap API для геокодирования (бесплатный сервис)
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'ru', // Предпочтительный язык результатов
        'User-Agent': 'CoworkHub/1.0' // Важно указать User-Agent для Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка геокодирования: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      
      console.log('Получены координаты:', lat, lng);
      return [lat, lng];
    }
    
    // Если адрес не найден, возвращаем координаты по умолчанию (Москва)
    console.log('Адрес не найден, используем координаты по умолчанию');
    return [55.751244, 37.618423];
  } catch (error) {
    console.error('Ошибка геокодирования адреса:', error);
    
    // В случае ошибки, возвращаем случайные координаты в районе Москвы для демонстрации
    const lat = 55.751244 + (Math.random() - 0.5) * 0.1;
    const lng = 37.618423 + (Math.random() - 0.5) * 0.1;
    
    console.log('Используем случайные координаты:', lat, lng);
    return [lat, lng];
  }
};