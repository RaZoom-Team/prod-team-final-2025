import { apiRequest } from './apiClient';
import { API_BASE_URL } from '../../../config';
import { Floor } from '../types';

/**
 * Fetches all floors for a coworking
 * @param coworkingId - The coworking ID
 * @returns Array of floors
 */
export const getFloors = async (coworkingId: string): Promise<Floor[]> => {
  try {
    // Get floors data from the schemes endpoint
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes`, {
      headers: {
        'Authorization': localStorage.getItem('authToken') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch floors');
    }

    const data = await response.json();
    
    // Convert object with floor numbers as keys to array of floors
    const floors = Object.values(data).map((floor: any) => ({
      id: `floor-${floor.floor}`,
      name: `Этаж ${floor.floor}`,
      level: floor.floor,
      mapImage: `${API_BASE_URL}/files/${floor.image_id}`,
      places: floor.places.map((place: any) => ({
        id: place.id.toString(),
        name: place.name,
        x: place.x || 50,
        y: place.y || 50,
        size: place.size || 1,
        tags: place.features || [],
        photo: place.image_id ? `${API_BASE_URL}/files/${place.image_id}` : undefined,
        status: 'available',
        shape: 'circle',
        rotation: place.rotate || 0,
      }))
    }));

    return floors;
  } catch (error) {
    console.error(`Error fetching floors for coworking ${coworkingId}:`, error);
    return [];
  }
};

/**
 * Creates a new floor
 * @param coworkingId - The coworking ID
 * @param data - The floor data
 * @returns The created floor or null if creation failed
 */
export const createFloor = async (coworkingId: string, data: { level: number; mapImage?: string; mapImageFile?: File | null }): Promise<Floor | null> => {
  try {
    // First, upload the floor map image if provided
    let imageId = '';
    
    if (data.mapImageFile) {
      const formData = new FormData();
      formData.append('file', data.mapImageFile);
      
      const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload floor map image');
      }
      
      const uploadData = await uploadResponse.json();
      imageId = uploadData.image_id;
    } else if (data.mapImage) {
      // If mapImage is already an image_id, use it
      // Extract the image ID from the URL if it's a full URL
      const match = data.mapImage.match(/\/files\/(.+)$/);
      if (match && match[1]) {
        imageId = match[1];
      } else {
        imageId = data.mapImage;
      }
    }
    
    if (!imageId) {
      throw new Error('Floor map image is required');
    }
    
    // Create floor
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('authToken') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        floor: data.level,
        image_id: imageId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create floor');
    }

    // Fetch the floors again to get the created floor
    const floors = await getFloors(coworkingId);
    const createdFloor = floors.find(floor => floor.level === data.level);
    
    return createdFloor || null;
  } catch (error) {
    console.error(`Error creating floor for coworking ${coworkingId}:`, error);
    throw error;
  }
};

/**
 * Updates a floor
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 * @param data - The floor data
 * @returns The updated floor or null if update failed
 */
export const updateFloor = async (coworkingId: string, floorId: string, data: { level?: number; mapImage?: string; mapImageFile?: File | null }): Promise<Floor | null> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const currentFloorLevel = parseInt(floorId.replace('floor-', ''), 10);
    const newFloorLevel = data.level !== undefined ? data.level : currentFloorLevel;
    
    // First, upload the new floor map image if provided
    let imageId = '';
    
    if (data.mapImageFile) {
      const formData = new FormData();
      formData.append('file', data.mapImageFile);
      
      const uploadResponse = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload floor map image');
      }
      
      const uploadData = await uploadResponse.json();
      imageId = uploadData.image_id;
    } else if (data.mapImage) {
      // If mapImage is already an image_id or URL, extract the ID
      const match = data.mapImage.match(/\/files\/(.+)$/);
      if (match && match[1]) {
        imageId = match[1];
      } else {
        imageId = data.mapImage;
      }
    }
    
    if (!imageId) {
      throw new Error('Floor map image is required');
    }
    
    if (currentFloorLevel !== newFloorLevel) {
      console.log(`Changing floor level from ${currentFloorLevel} to ${newFloorLevel}`);
      
      await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/${currentFloorLevel}`, {
        method: 'PATCH',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floor: newFloorLevel,
          image_id: imageId,
        }),
      });
      
    } else {

      const updateResponse = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/${currentFloorLevel}`, {
        method: 'PATCH',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floor: newFloorLevel,
          image_id: imageId,
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update floor');
      }
    }

    // Fetch the floors again to get the updated floor
    const floors = await getFloors(coworkingId);
    const updatedFloor = floors.find(floor => floor.level === newFloorLevel);
    
    return updatedFloor || null;
  } catch (error) {
    console.error(`Error updating floor ${floorId} for coworking ${coworkingId}:`, error);
    throw error;
  }
};

/**
 * Deletes a floor
 * @param coworkingId - The coworking ID
 * @param floorId - The floor ID
 */
export const deleteFloor = async (coworkingId: string, floorId: string): Promise<void> => {
  try {
    // Extract the floor level from the floorId (assuming format "floor-{level}")
    const floorLevel = parseInt(floorId.replace('floor-', ''), 10);
    
    console.log(`Deleting floor ${floorLevel} from coworking ${coworkingId}`);
    
    // Delete the floor using the direct DELETE endpoint
    const response = await fetch(`${API_BASE_URL}/buildings/${coworkingId}/schemes/${floorLevel}`, {
      method: 'DELETE',
      headers: {
        'Authorization': localStorage.getItem('authToken') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to delete floor: ${errorData.message || response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting floor ${floorId} for coworking ${coworkingId}:`, error);
    throw error;
  }
};