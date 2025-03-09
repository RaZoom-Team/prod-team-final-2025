import { apiRequest } from './apiClient';
import { uploadFile } from './fileApi';
import { buildingToCoworking } from './mappers';
import {
  BuildingDTO,
  CreateBuildingDTO,
  CoworkingCreateParams,
  CoworkingUpdateParams
} from './types';
import { Coworking } from '../types';

/**
 * Fetches all coworkings (buildings)
 * @returns Array of coworking spaces
 */
export const getCoworkings = async (): Promise<Coworking[]> => {
  try {
    const buildings = await apiRequest<BuildingDTO[]>({
      url: '/buildings',
      method: 'GET',
    });

    return buildings.map(buildingToCoworking);
  } catch (error) {
    console.error('Error fetching coworkings:', error);
    return [];
  }
};

/**
 * Fetches a coworking (building) by ID
 * @param id - The coworking ID
 * @returns The coworking or null if not found
 */
export const getCoworkingById = async (id: string): Promise<Coworking | null> => {
  try {
    const building = await apiRequest<BuildingDTO>({
      url: `/buildings/${id}`,
      method: 'GET',
    });

    return buildingToCoworking(building);
  } catch (error) {
    console.error(`Error fetching coworking with ID ${id}:`, error);
    return null;
  }
};

/**
 * Creates a new coworking (building)
 * @param data - The coworking data
 * @returns The created coworking or null if creation failed
 */
export const createCoworking = async (data: CoworkingCreateParams): Promise<Coworking | null> => {
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
      open_from: data.open_from, // Convert to seconds
      open_till: data.open_till, // Convert to seconds
      x: data.coordinates?.x || 0,
      y: data.coordinates?.y || 0,
      images_id: imageIds,
    };

    console.log('билдинг дата((', buildingData)

    // Create building
    const building = await apiRequest<BuildingDTO>({
      url: '/buildings',
      method: 'POST',
      data: buildingData,
    });

    return buildingToCoworking(building);
  } catch (error) {
    console.error('Error creating coworking:', error);
    return null;
  }
};

/**
 * Updates a coworking (building)
 * @param params - The update parameters including ID and data
 * @returns The updated coworking or null if update failed
 */
export const updateCoworking = async (params: CoworkingUpdateParams): Promise<Coworking | null> => {
  try {
    const { id, ...data } = params;

    // First, get the current building to preserve existing image IDs
    const currentBuilding = await apiRequest<BuildingDTO>({
      url: `/buildings/${id}`,
      method: 'GET',
    });

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
      open_from: data.open_from,
      open_till: data.open_till,
      x: data.coordinates?.x || currentBuilding.x,
      y: data.coordinates?.y || currentBuilding.y,
      images_id: imageIds.filter(x => !data.remove_photos.includes(x)),
    };

    // Update building
    const building = await apiRequest<BuildingDTO>({
      url: `/buildings/${id}`,
      method: 'PATCH',
      data: buildingData,
    });

    return buildingToCoworking(building);
  } catch (error) {
    console.error(`Error updating coworking with ID ${params.id}:`, error);
    return null;
  }
};

/**
 * Deletes a coworking (building)
 * @param id - The coworking ID
 */
export const deleteCoworking = async (id: string): Promise<void> => {
  try {
    await apiRequest({
      url: `/buildings/${id}`,
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting coworking with ID ${id}:`, error);
    throw error;
  }
};
