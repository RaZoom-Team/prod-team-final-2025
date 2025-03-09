import { apiRequest } from './apiClient';
import { placeVisitToBooking, visitorPlaceVisitToBooking } from './mappers';
import { getSpaceById } from './placeApi';
import { getBuildingVisits, checkPlaceAvailability } from './visitApi';
import { 
  VisitorPlaceVisitDTO, 
  PlaceVisitDTO, 
  CreateVisitorDTO,
  BookingCreateParams
} from './types';
import { Booking } from '../types';

/**
 * Fetches all bookings for a user
 * @param userId - The user ID (optional)
 * @returns Array of bookings
 */
export const getBookings = async (userId?: string): Promise<Booking[]> => {
  try {
    const visitsData = await apiRequest<VisitorPlaceVisitDTO[]>({
      url: '/clients/visits',
      method: 'GET',
    });
    
    // Фильтруем только активные брони (не прошедшие по времени)
    const now = new Date();
    const activeVisits = visitsData.filter(visit => {
      const endTime = new Date(visit.visit_till);
      return endTime >= now;
    });
    
    return activeVisits.map(visit => ({
      id: visit.id.toString(), // Используем ID визита как ID брони
      spaceId: visit.place.id.toString(),
      userId: userId || 'current-user',
      startTime: visit.visit_from,
      endTime: visit.visit_till,
      status: visit.is_ended ? 'cancelled' : 'confirmed',
      createdAt: new Date().toISOString(),
      isVisited: visit.is_visited,
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

/**
 * Creates a booking
 * @param data - The booking data
 * @returns The created booking or null if creation failed
 */
export const createBooking = async (data: BookingCreateParams): Promise<Booking | null> => {
  try {
    // First, get the place to find its coworking ID
    const space = await getSpaceById(data.spaceId);
    
    if (!space) {
      throw new Error(`Space with ID ${data.spaceId} not found`);
    }
    
    const coworkingId = space.coworkingId;
    const placeId = parseInt(data.spaceId);
    
    // Check if the place is available for the requested time period
    const isAvailable = await checkPlaceAvailability(
      parseInt(coworkingId),
      placeId,
      data.startTime,
      data.endTime
    );
    
    if (!isAvailable) {
      throw new Error('This space is already booked for the selected time period');
    }
    
    // Prepare booking data
    const bookingData: CreateVisitorDTO = {
      visit_from: data.startTime,
      visit_till: data.endTime,
    };
    
    // Create booking
    const visitData = await apiRequest<PlaceVisitDTO>({
      url: `/buildings/${coworkingId}/places/${placeId}/visits`,
      method: 'POST',
      data: bookingData,
    });
    
    if (!visitData) {
      throw new Error('Failed to create booking: No response from server');
    }
    
    // Создаем объект бронирования из данных визита
    const booking: Booking = {
      id: visitData.id.toString(),
      spaceId: visitData.place_id,
      userId: data.userId,
      startTime: visitData.visit_from,
      endTime: visitData.visit_till,
      status: visitData.is_visited ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
      isVisited: visitData.is_visited || false,
    };
    
    return booking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Gets a booking by ID
 * @param bookingId - The booking ID
 * @returns The booking or null if not found
 */
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    // Get all bookings and find the one with the matching ID
    const bookings = await getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      console.warn(`Booking with ID ${bookingId} not found in current bookings`);
      // Instead of throwing an error, return a default booking object
      return {
        id: bookingId,
        spaceId: '0',
        userId: 'unknown',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'cancelled',
        createdAt: new Date().toISOString(),
        isVisited: false
      };
    }
    
    return booking;
  } catch (error) {
    console.error(`Error fetching booking with ID ${bookingId}:`, error);
    // Return a default booking object instead of null
    return {
      id: bookingId,
      spaceId: '0',
      userId: 'unknown',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'cancelled',
      createdAt: new Date().toISOString(),
      isVisited: false
    };
  }
};

/**
 * Cancels a booking
 * @param bookingId - The booking ID
 */
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    // Get the booking details to find the space
    const booking = await getBookingById(bookingId);
    
    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    // If booking is already cancelled or has a default spaceId, just return
    if (booking.status === 'cancelled' || booking.spaceId === '0') {
      console.log(`Booking ${bookingId} is already cancelled or invalid`);
      return;
    }
    
    try {
      // Get the space to find its coworking ID
      const space = await getSpaceById(booking.spaceId);
      
      if (!space) {
        console.warn(`Space with ID ${booking.spaceId} not found, booking may have been deleted on backend`);
        return; // Just return without error if space doesn't exist anymore
      }
      
      const coworkingId = space.coworkingId;
      const placeId = parseInt(booking.spaceId);
      
      // Use the booking ID directly as the visit ID
      const visitId = parseInt(bookingId);
      
      // Delete booking
      await apiRequest({
        url: `/buildings/${coworkingId}/places/${placeId}/visits/${visitId}`,
        method: 'DELETE',
      });
    } catch (error) {
      console.warn(`Error finding space for booking ${bookingId}, it may have been deleted on backend:`, error);
      // Don't throw error if the space or coworking doesn't exist anymore
    }
  } catch (error) {
    console.error(`Error canceling booking ${bookingId}:`, error);
    throw error;
  }
};