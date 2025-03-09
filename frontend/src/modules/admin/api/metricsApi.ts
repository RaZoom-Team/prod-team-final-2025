import { apiRequest } from '../../cowork/api/apiClient';
import { API_BASE_URL } from '../../../config';

// Типы данных для метрик
export interface LastBookingViewForMetrics {
  id: number;
  client_name: string;
  place_name: string;
  building_name: string;
  visit_from: string;
  visit_till: string;
  is_visited: boolean;
  duration_minutes: number;
}

export interface PopularPlaceViewForMetrics {
  id: number;
  name: string;
  building_name: string;
  visit_count: number;
}

export interface MetricsDTO {
  average_visit_duration_minutes: number;
  average_book_duration_minutes: number;
  coworking_count: number;
  user_count: number;
  total_bookings: number;
  last_bookings: LastBookingViewForMetrics[];
  most_popular_places: PopularPlaceViewForMetrics[];
}

/**
 * Получает метрики организации
 * @returns Метрики организации
 */
export const getMetrics = async (): Promise<MetricsDTO> => {
  try {
    return await apiRequest<MetricsDTO>({
      url: '/system/metrics',
      method: 'GET',
    });
  } catch (error) {
    console.error('Ошибка при получении метрик:', error);
    throw error;
  }
};