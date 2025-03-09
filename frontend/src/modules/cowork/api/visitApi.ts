import { apiRequest } from './apiClient';
import { VisitorDTO } from './types';

/**
 * Fetches all active visits (bookings) for a building
 * @param buildingId - The building ID
 * @returns Array of visits
 */
export const getBuildingVisits = async (buildingId: number): Promise<VisitorDTO[]> => {
  try {
    const visits = await apiRequest<VisitorDTO[]>({
      url: `/buildings/${buildingId}/schemes/visits`,
      method: 'GET',
    });
    
    return visits;
  } catch (error) {
    console.error(`Error fetching visits for building ${buildingId}:`, error);
    return [];
  }
};

/**
 * Checks if a place is available for booking during a specific time period
 * @param buildingId - The building ID
 * @param placeId - The place ID
 * @param startTime - The start time (ISO string)
 * @param endTime - The end time (ISO string)
 * @returns True if the place is available, false otherwise
 */
export const checkPlaceAvailability = async (
  buildingId: number,
  placeId: number,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  try {
    // Get all visits for the building
    const visits = await getBuildingVisits(buildingId);
    
    // Filter visits for the specific place
    const placeVisits = visits.filter(visit => visit.place_id === placeId);
    
    // Check if any visit overlaps with the requested time period
    const requestStart = new Date(startTime).getTime();
    const requestEnd = new Date(endTime).getTime();
    
    const isOverlapping = placeVisits.some(visit => {
      const visitStart = new Date(visit.visit_from).getTime();
      const visitEnd = new Date(visit.visit_till).getTime();
      
      // Check for overlap
      return (
        (requestStart >= visitStart && requestStart < visitEnd) || // Start time is during an existing booking
        (requestEnd > visitStart && requestEnd <= visitEnd) || // End time is during an existing booking
        (requestStart <= visitStart && requestEnd >= visitEnd) // Completely encompasses an existing booking
      );
    });
    
    return !isOverlapping;
  } catch (error) {
    console.error(`Error checking availability for place ${placeId} in building ${buildingId}:`, error);
    return false;
  }
};

/**
 * Mark a visit as visited (for administrators)
 * @param buildingId - The building ID
 * @param placeId - The place ID
 * @param visitId - The visit ID
 * @returns True if successful
 */
export const markVisitAsVisited = async (
  buildingId: number,
  placeId: number,
  visitId: number
): Promise<boolean> => {
  try {
    // Используем правильный эндпоинт для отметки посещения
    await apiRequest({
      url: `/buildings/${buildingId}/places/${placeId}/visits/${visitId}/visited`,
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error(`Error marking visit ${visitId} as visited:`, error);
    throw error;
  }
};

/**
 * Create a visit data object for QR code generation
 * @param buildingId - The building ID
 * @param placeId - The place ID
 * @param visitId - The visit ID
 * @returns Visit data object for QR code
 */
export const createVisitQrCodeData = (
  buildingId: number | string,
  placeId: number | string,
  visitId: number | string
): string => {
  // Create a data object with the visit information
  const visitData = {
    buildingId,
    placeId,
    visitId
  };
  
  // Return a simple JSON string
  return JSON.stringify(visitData);
};