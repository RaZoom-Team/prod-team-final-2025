import { API_BASE_URL } from '../../../config';
import { getAuthToken } from '../../user/api/authApi';
import { Coworking, Floor, Place, Space, Booking } from '../types';

// Helper function to add auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': token } : {};
};

// API Data Types based on Swagger
export interface BuildingDTO {
  id: number;
  name: string;
  description: string;
  open_from: number | null;
  open_till: number | null;
  address: string;
  x: number;
  y: number;
  images_id?: string[];
  image_urls?: string[];
  floor_images?: Record<string, string>;
}

export interface CreateBuildingDTO {
  name: string;
  description: string;
  open_from: number | null;
  open_till: number | null;
  address: string;
  x: number;
  y: number;
  images_id?: string[];
}

export interface PlaceDTO {
  id: number;
  name: string;
  features: string[];
  floor: number;
  x: number | null;
  y: number | null;
  building_id: number;
  size?: number;
  rotate?: number;
  image_id?: string | null;
  image_url?: string | null;
}

export interface CreatePlaceDTO {
  name: string;
  features: string[];
  floor?: number | null;
  x: number | null;
  y: number | null;
  size?: number;
  rotate?: number;
  image_id?: string | null;
}

export interface UpdatePlaceDTO {
  name?: string;
  features?: string[];
  size?: number;
  rotate?: number;
  x?: number | null;
  y?: number | null;
  image_id?: string | null;
}

export interface BuildingFloor {
  floor: number;
  image_id: string;
  places: PlaceDTO[];
  image_url: string;
}

export interface CreateSchemeDTO {
  floor: number;
  image_id: string;
}

export interface VisitorDTO {
  id: number;
  place_id: number;
  visit_from: string; // ISO date string
  visit_till: string; // ISO date string
}

export interface CreateVisitorDTO {
  visit_from: string; // ISO date string
  visit_till: string; // ISO date string
}

export interface PlaceVisitDTO {
  id: number;
  client_id: number;
  place_id: number;
  visit_from: string; // ISO date string
  visit_till: string; // ISO date string
  is_visited: boolean;
}

export interface VisitorPlaceVisitDTO {
  visit_from: string; // ISO date string
  visit_till: string; // ISO date string
  place: PlaceDTO;
  is_ended: boolean;
}

export interface UploadFileResponse {
  image_id: string;
  image_url: string;
}

// Conversion functions
const buildingToCoworking = (building: BuildingDTO): Coworking => {
  return {
    id: building.id.toString(),
    name: building.name,
    description: building.description,
    address: building.address,
    coordinates: {
      x: building.x,
      y: building.y
    },
    geoCoordinates: [building.y, building.x], // Convert to [lat, lng] format
    photos: building.image_urls || [],
    organizationId: '1', // Default organization ID
  };
};

const placeToSpace = (place: PlaceDTO): Space => {
  return {
    id: place.id.toString(),
    name: place.name,
    description: place.features.join(', '),
    photo: place.image_url || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    floor: place.floor,
    coworkingId: place.building_id.toString(),
    status: 'available', // Default status
  };
};

const placeToFloorPlace = (place: PlaceDTO): Place => {
  return {
    id: place.id.toString(),
    name: place.name,
    x: place.x !== null ? place.x : 50,
    y: place.y !== null ? place.y : 50,
    size: place.size || 1,
    tags: place.features,
    photo: place.image_url || undefined,
    status: 'available',
    shape: 'circle',
    rotation: place.rotate || 0,
  };
};

// Create Floor objects from BuildingFloor
const buildingFloorToFloor = (buildingFloor: BuildingFloor): Floor => {
  return {
    id: `floor-${buildingFloor.floor}`,
    name: `Floor ${buildingFloor.floor}`,
    level: buildingFloor.floor,
    mapImage: buildingFloor.image_url,
    places: buildingFloor.places.map(placeToFloorPlace),
  };
};

// API Functions

// Get all coworkings (buildings)
export const getCoworkings = async (): Promise<Coworking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch coworkings');
    }

    const buildings: BuildingDTO[] = await response.json();
    return buildings.map(buildingToCoworking);
  } catch (error) {
    console.error('Error fetching coworkings:', error);
    return [];
  }
};

// Get coworking (building) by ID
export const getCoworkingById = async (id: string): Promise<Coworking | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Coworking not found');
    }

    const building: BuildingDTO = await response.json();
    
    // Get floors for this building
    const floorsResponse = await fetch(`${API_BASE_URL}/buildings/${id}/schemes`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });
    
    let floors: Floor[] = [];
    
    if (floorsResponse.ok) {
      const floorsData = await floorsResponse.json();
      
      // Check if the response is an object with floor numbers as keys
      if (floorsData && typeof floorsData === 'object' && !Array.isArray(floorsData)) {
        floors = Object.values(floorsData).map(buildingFloorToFloor);
      }
    }
    
    const coworking = buildingToCoworking(building);
    coworking.floors = floors;
    
    return coworking;
  } catch (error) {
    console.error(`Error fetching coworking with ID ${id}:`, error);
    return null;
  }
};

// Create a new coworking (building)
export const createCoworking = async (data: Partial<Coworking> & { photoFiles?: File[] }): Promise<Coworking | null> => {
  try {
    // First, upload all photos if any
    const imageIds: string[] = [];
    
    if (data.photoFiles && data.photoFiles.length > 0) {
      for (const file of data.photoFiles) {
        if (file) {
          const uploadResult = await uploadFile(file);
          if (uploadResult) {
            imageIds.push(uploadResult.image_id);
          }
        }
      }
    }

    console.log(data)
    
    // Prepare building data
    const buildingData: CreateBuildingDTO = {
      name: data.name || '',
      description: data.description || '',
      address: data.address || '',
      open_from: data.open_from != null ? data.open_from : null,
      open_till: data.open_till != null ? data.open_till : null,
      x: data.coordinates?.x || 0,
      y: data.coordinates?.y || 0,
      images_id: imageIds,
    };
    
    // Create building
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(buildingData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create coworking');
    }

    const building: BuildingDTO = await response.json();
    return buildingToCoworking(building);
  } catch (error) {
    console.error('Error creating coworking:', error);
    return null;
  }
};

// Update a coworking (building)
export const updateCoworking = async (id: string, data: Partial<Coworking> & { photoFiles?: File[] }): Promise<Coworking | null> => {
  try {
    // First, get the current building to preserve existing image IDs
    const currentResponse = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });
    
    if (!currentResponse.ok) {
      throw new Error(`Failed to fetch current coworking with ID ${id}`);
    }
    
    const currentBuilding: BuildingDTO = await currentResponse.json();
    let imageIds = currentBuilding.images_id || [];
    
    // Upload new photos if any
    if (data.photoFiles && data.photoFiles.length > 0) {
      for (const file of data.photoFiles) {
        if (file) {
          const uploadResult = await uploadFile(file);
          if (uploadResult) {
            imageIds.push(uploadResult.image_id);
          }
        }
      }
    }
    
    // Prepare building data for update
    const buildingData: CreateBuildingDTO = {
      name: data.name || currentBuilding.name,
      description: data.description || currentBuilding.description,
      address: data.address || currentBuilding.address,
      open_from: currentBuilding.open_from,
      open_till: currentBuilding.open_till,
      x: data.coordinates?.x || currentBuilding.x,
      y: data.coordinates?.y || currentBuilding.y,
      images_id: imageIds,
    };
    
    // Update building
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(buildingData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to update coworking with ID ${id}`);
    }

    const building: BuildingDTO = await response.json();
    return buildingToCoworking(building);
  } catch (error) {
    console.error(`Error updating coworking with ID ${id}:`, error);
    return null;
  }
};

// Delete a coworking (building)
export const deleteCoworking = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete coworking with ID ${id}`);
    }
  } catch (error) {
    console.error(`Error deleting coworking with ID ${id}:`, error);
    throw error;
  }
};

// Get all floors for a coworking
export const getFloors = async (coworkingId: string): Promise<Floor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch floors for coworking ${coworkingId}`);
    }

    const floorsData = await response.json();
    
    // Check if the response is an object with floor numbers as keys
    if (floorsData && typeof floorsData === 'object' && !Array.isArray(floorsData)) {
      return Object.values(floorsData).map(buildingFloorToFloor);
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching floors for coworking ${coworkingId}:`, error);
    return [];
  }
};

// Create a new floor
export const createFloor = async (coworkingId: string, data: { level: number; mapImage?: string; mapImageFile?: File | null }): Promise<Floor | null> => {
  try {
    // First, upload the floor map image if provided
    let imageId = '';
    
    if (data.mapImageFile) {
      const uploadResult = await uploadFile(data.mapImageFile);
      if (uploadResult) {
        imageId = uploadResult.image_id;
      }
    } else if (data.mapImage) {
      // If mapImage is already an image_id, use it
      imageId = data.mapImage;
    }
    
    if (!imageId) {
      throw new Error('Floor map image is required');
    }
    
    // Create scheme data
    const schemeData: CreateSchemeDTO = {
      floor: data.level,
      image_id: imageId,
    };
    
    // Create floor
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(schemeData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create floor: ${errorData.message || 'Unknown error'}`);
    }

    // The API returns 204 No Content, so we need to fetch the floors again
    const floors = await getFloors(coworkingId);
    const createdFloor = floors.find(floor => floor.level === data.level);
    
    return createdFloor || null;
  } catch (error) {
    console.error(`Error creating floor for coworking ${coworkingId}:`, error);
    throw error;
  }
};

// Update a floor
export const updateFloor = async (coworkingId: string, floorId: string, data: Partial<Floor> & { mapImageFile?: File | null }): Promise<Floor | null> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const floorLevel = parseInt(floorId.replace('floor-', ''), 10);
    
    // First, upload the new floor map image if provided
    let imageId = '';
    
    if (data.mapImageFile) {
      const uploadResult = await uploadFile(data.mapImageFile);
      if (uploadResult) {
        imageId = uploadResult.image_id;
      }
    } else if (data.mapImage) {
      // If mapImage is already an image_id, use it
      imageId = data.mapImage;
    }
    
    if (!imageId) {
      throw new Error('Floor map image is required');
    }
    
    // Create scheme data
    const schemeData: CreateSchemeDTO = {
      floor: data.level || floorLevel,
      image_id: imageId,
    };
    
    // Update floor by creating a new one (API doesn't have a direct update endpoint)
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(schemeData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update floor: ${errorData.message || 'Unknown error'}`);
    }

    // The API returns 204 No Content, so we need to fetch the floors again
    const floors = await getFloors(coworkingId);
    const updatedFloor = floors.find(floor => floor.level === (data.level || floorLevel));
    
    return updatedFloor || null;
  } catch (error) {
    console.error(`Error updating floor ${floorId} for coworking ${coworkingId}:`, error);
    return null;
  }
};

// Delete a floor (not directly supported by API, would need to delete all places first)
export const deleteFloor = async (coworkingId: string, floorId: string): Promise<void> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const floorLevel = parseInt(floorId.replace('floor-', ''), 10);
    
    // Get all places on this floor
    const floors = await getFloors(coworkingId);
    const floor = floors.find(f => f.level === floorLevel);
    
    if (!floor) {
      throw new Error(`Floor ${floorId} not found`);
    }
    
    // Delete all places on this floor
    for (const place of floor.places) {
      await deletePlace(coworkingId, floorId, place.id);
    }
    
    // Note: The API doesn't have a direct endpoint to delete a floor
    // We've deleted all places, but the floor itself might still exist in the backend
  } catch (error) {
    console.error(`Error deleting floor ${floorId} for coworking ${coworkingId}:`, error);
    throw error;
  }
};

// Get all places for a coworking
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

// Get a place by ID
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
            photo: place.photo || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
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

// Get a place by ID from a specific coworking and floor
export const getPlaceByIdFromCoworking = async (coworkingId: string, floorId: string, placeId: string): Promise<Place | null> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const floorLevel = parseInt(floorId.replace('floor-', ''), 10);
    
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/places/${placeId}`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch place with ID ${placeId}`);
    }

    const placeDTO: PlaceDTO = await response.json();
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error fetching place with ID ${placeId}:`, error);
    return null;
  }
};

// Create a new place
export const createPlace = async (coworkingId: string, floorId: string, data: Omit<Place, 'id'> & { photoFile?: File }): Promise<Place | null> => {
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
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/${floorLevel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(placeData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create place: ${errorData.message || 'Unknown error'}`);
    }

    const placeDTO: PlaceDTO = await response.json();
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error creating place for coworking ${coworkingId}, floor ${floorId}:`, error);
    return null;
  }
};

// Update a place
export const updatePlace = async (coworkingId: string, floorId: string, placeId: string, data: Partial<Place> & { photoFile?: File | null }): Promise<Place | null> => {
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
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/places/${placeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(placeData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update place: ${errorData.message || 'Unknown error'}`);
    }

    const placeDTO: PlaceDTO = await response.json();
    return placeToFloorPlace(placeDTO);
  } catch (error) {
    console.error(`Error updating place ${placeId} for coworking ${coworkingId}, floor ${floorId}:`, error);
    return null;
  }
};

// Delete a place
export const deletePlace = async (coworkingId: string, floorId: string, placeId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/places/${placeId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to delete place: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error deleting place ${placeId} for coworking ${coworkingId}, floor ${floorId}:`, error);
    throw error;
  }
};

// Get all bookings for a user
export const getBookings = async (userId?: string): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/visits`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const visitsData: VisitorPlaceVisitDTO[] = await response.json();
    
    return visitsData.map(visit => ({
      id: `visit-${Math.random().toString(36).substring(2, 9)}`, // Generate a random ID since the API doesn't provide one
      spaceId: visit.place.id.toString(),
      userId: userId || 'current-user',
      startTime: visit.visit_from,
      endTime: visit.visit_till,
      status: visit.is_ended ? 'cancelled' : 'confirmed',
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// Create a booking
export const createBooking = async (data: { spaceId: string; userId: string; startTime: string; endTime: string; status: string }): Promise<Booking | null> => {
  try {
    // First, get the place to find its coworking ID
    const space = await getSpaceById(data.spaceId);
    
    if (!space) {
      throw new Error(`Space with ID ${data.spaceId} not found`);
    }
    
    const coworkingId = space.coworkingId;
    const placeId = data.spaceId;
    
    // Prepare booking data
    const bookingData: CreateVisitorDTO = {
      visit_from: data.startTime,
      visit_till: data.endTime,
    };
    
    // Create booking
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/places/${placeId}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(bookingData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create booking: ${errorData.message || 'Unknown error'}`);
    }

    const visitData: PlaceVisitDTO = await response.json();
    
    return {
      id: visitData.id.toString(),
      spaceId: visitData.place_id.toString(),
      userId: visitData.client_id.toString(),
      startTime: visitData.visit_from,
      endTime: visitData.visit_till,
      status: visitData.is_visited ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
};

// Cancel a booking
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    // First, get all bookings to find the one with this ID
    const bookings = await getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      throw new Error(`Booking with ID ${bookingId} not found`);
    }
    
    // Get the space to find its coworking ID
    const space = await getSpaceById(booking.spaceId);
    
    if (!space) {
      throw new Error(`Space with ID ${booking.spaceId} not found`);
    }
    
    const coworkingId = space.coworkingId;
    const placeId = booking.spaceId;
    
    // Delete booking
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/places/${placeId}/visits/${bookingId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to cancel booking: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error canceling booking ${bookingId}:`, error);
    throw error;
  }
};

// Upload a file
export const uploadFile = async (file: File): Promise<UploadFileResponse | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Geocode an address to coordinates
export const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    // This is a mock implementation since the API doesn't provide geocoding
    // In a real app, you would use a geocoding service like Google Maps or Nominatim
    
    // Return random coordinates near Moscow for testing
    const lat = 55.751244 + (Math.random() - 0.5) * 0.1;
    const lng = 37.618423 + (Math.random() - 0.5) * 0.1;
    
    return [lat, lng];
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};