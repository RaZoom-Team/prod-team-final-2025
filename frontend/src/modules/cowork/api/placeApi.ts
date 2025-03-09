import { apiRequest } from './apiClient';
import { uploadFile } from './fileApi';
import { placeToFloorPlace, placeToSpace } from './mappers';
import { getFloors } from './floorApi';
import { getCoworkings } from './buildingApi';
import { 
  PlaceDTO, 
  CreatePlaceDTO, 
  UpdatePlaceDTO,
  PlaceCreateParams,
  PlaceUpdateParams
} from './types';
import { Place, Space } from '../types';

/**
 * Fetches all places for a coworking
 * @param coworkingId - The coworking ID (optional)
 * @returns Array of spaces
 */
export const getPlaces = async (coworkingId?: string): Promise<Space[]> => {
  try {
    if (!coworkingId) {
      // If no coworkingId is provided, get all coworkings and their places
      const coworkings = await getCoworkings();
      const allSpaces: Space[] = [];
      
      for (const coworking of coworkings) {
        const floors = await getFloors(coworking.id);
        
        for (const floor of floors) {
          const spaces = floor.places.map(place => ({
            id: place.id,
            name: place.name,
            description: place.tags.join(', '),
            photo: place.photo || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            floor: floor.level,
            coworkingId: coworking.id,
            status: 'available', // Default status
          }));
          
          allSpaces.push(...spaces);
        }
      }
      
      return allSpaces;
    }
    
    // Get floors for this coworking
    const floors = await getFloors(coworkingId);
    
    // Collect all places from all floors
    const spaces: Space[] = [];
    
    for (const floor of floors) {
      const floorSpaces = floor.places.map(place => ({
        id: place.id,
        name: place.name,
        description: place.tags.join(', '),
        photo: place.photo || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        floor: floor.level,
        coworkingId: coworkingId,
        status: 'available', // Default status
      }));
      
      spaces.push(...floorSpaces);
    }
    
    return spaces;
  } catch (error) {
    console.error(`Error fetching places for coworking ${coworkingId}:`, error);
    return [];
  }
};

/**
 * Fetches a place by ID
 * @param placeId - The place ID
 * @returns The space or null if not found
 */
export const getSpaceById = async (placeId: string): Promise<Space | null> => {
  try {
    // Since we don't know which coworking this place belongs to,
    // we need to search through all coworkings
    const coworkings = await getCoworkings();
    
    for (const coworking of coworkings) {
      const floors = await getFloors(coworking.id);
      
      for (const floor of floors) {
        const place = floor.places.find(p => p.id === placeId);
        
        if (place) {
          return {
            id: place.id,
            name: place.name,
            description: place.tags.join(', '),
            photo: place.photo,
            floor: floor.level,
            coworkingId: coworking.id,
            status: 'available', // Default status
          };
        }
      }
    }
    
    throw new Error(`Place with ID ${placeId} not found`);
  } catch (error) {
    console.error(`Error fetching place with ID ${placeId}:`, error);
    return null;
  }
};

/**
 * Fetches a place by ID from a specific coworking and floor
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 * @param placeId - The place ID
 * @returns The place or null if not found
 */
export const getPlaceByIdFromCoworking = async (
  coworkingId: string, 
  floorId: string, 
  placeId: string
): Promise<Place | null> => {
  try {
    const placeDTO = await apiRequest<PlaceDTO>({
      url: `/buildings/${coworkingId}/schemes/places/${placeId}`,
      method: 'GET',
    });
    
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error fetching place with ID ${placeId}:`, error);
    return null;
  }
};

/**
 * Creates a new place
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 * @param data - The place data
 * @returns The created place or null if creation failed
 */
export const createPlace = async (
  coworkingId: string, 
  floorId: string, 
  data: PlaceCreateParams
): Promise<Place | null> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const floorLevel = parseInt(floorId.replace('floor-', ''), 10);
    
    // First, upload the place image if provided
    let imageId = null;
    
    if (data.photoFile) {
      const uploadResult = await uploadFile(data.photoFile);
      if (uploadResult) {
        imageId = uploadResult.image_id;
      }
    } else if (data.photo) {
      // If photo is already an image_id, use it
      imageId = data.photo;
    }
    
    // Prepare place data
    const placeData: CreatePlaceDTO = {
      name: data.name,
      features: data.tags || [],
      floor: floorLevel,
      x: data.x,
      y: data.y,
      size: data.size,
      rotate: data.rotation,
      image_id: imageId,
    };
    
    // Create place - removed /floor/ from the path
    const placeDTO = await apiRequest<PlaceDTO>({
      url: `/buildings/${coworkingId}/schemes/${floorLevel}`,
      method: 'POST',
      data: placeData,
    });
    
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error creating place for coworking ${coworkingId}, floor ${floorId}:`, error);
    return null;
  }
};

/**
 * Updates a place
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 * @param placeId - The place ID
 * @param data - The place data
 * @returns The updated place or null if update failed
 */
export const updatePlace = async (
  coworkingId: string, 
  floorId: string, 
  placeId: string, 
  data: PlaceUpdateParams
): Promise<Place | null> => {
  try {
    // First, upload the new place image if provided
    let imageId = null;
    
    if (data.photoFile) {
      const uploadResult = await uploadFile(data.photoFile);
      if (uploadResult) {
        imageId = uploadResult.image_id;
      }
    } else if (data.photo) {
      // If photo is already an image_id, use it
      imageId = data.photo;
    }
    
    // Prepare place data for update
    const placeData: UpdatePlaceDTO = {};
    
    if (data.name !== undefined) placeData.name = data.name;
    if (data.tags !== undefined) placeData.features = data.tags;
    if (data.x !== undefined) placeData.x = data.x;
    if (data.y !== undefined) placeData.y = data.y;
    if (data.size !== undefined) placeData.size = data.size;
    if (data.rotation !== undefined) placeData.rotate = data.rotation;
    if (imageId !== null) placeData.image_id = imageId;
    
    // Update place
    const placeDTO = await apiRequest<PlaceDTO>({
      url: `/buildings/${coworkingId}/schemes/places/${placeId}`,
      method: 'PATCH',
      data: placeData,
    });
    
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error updating place ${placeId} for coworking ${coworkingId}, floor ${floorId}:`, error);
    return null;
  }
};

/**
 * Deletes a place
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 * @param placeId - The place ID
 */
export const deletePlace = async (
  coworkingId: string, 
  floorId: string, 
  placeId: string
): Promise<void> => {
  try {
    await apiRequest({
      url: `/buildings/${coworkingId}/schemes/places/${placeId}`,
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting place ${placeId} for coworking ${coworkingId}, floor ${floorId}:`, error);
    throw error;
  }
};