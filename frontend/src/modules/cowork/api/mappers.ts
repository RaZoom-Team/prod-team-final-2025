import {
  BuildingDTO,
  BuildingFloor,
  PlaceDTO,
  PlaceVisitDTO,
  VisitorPlaceVisitDTO
} from './types';
import {
  Coworking,
  Floor,
  Place,
  Space,
  Booking
} from '../types';

/**
 * Converts a BuildingDTO to a Coworking domain object
 */
export const buildingToCoworking = (building: BuildingDTO): Coworking => {
  return {
    id: building.id.toString(),
    name: building.name,
    description: building.description,
    address: building.address,
    coordinates: {
      x: building.x,
      y: building.y
    },
    open_from: building.open_from ? building.open_from / 3600 : null,
    open_till: building.open_till ? building.open_till / 3600 : null,
    geoCoordinates: [building.y, building.x], // Convert to [lat, lng] format
    photos: building.image_urls || [],
    organizationId: '1', // Default organization ID
  };
};

/**
 * Converts a PlaceDTO to a Space domain object
 */
export const placeToSpace = (place: PlaceDTO): Space => {
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

/**
 * Converts a PlaceDTO to a Place domain object for floor maps
 */
export const placeToFloorPlace = (place: PlaceDTO): Place => {
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

/**
 * Converts a BuildingFloor to a Floor domain object
 */
export const buildingFloorToFloor = (buildingFloor: BuildingFloor): Floor => {
  return {
    id: `floor-${buildingFloor.floor}`,
    name: `Floor ${buildingFloor.floor}`,
    level: buildingFloor.floor,
    mapImage: buildingFloor.image_url,
    places: buildingFloor.places.map(placeToFloorPlace),
  };
};

/**
 * Converts a PlaceVisitDTO to a Booking domain object
 * Safely handles undefined or null values
 */
export const placeVisitToBooking = (visit: PlaceVisitDTO | null | undefined, userId: string): Booking => {
  if (!visit) {
    console.error('Visit object is undefined or null in placeVisitToBooking');
    // Return a default booking object to prevent errors
    return {
      id: 'error',
      spaceId: '0',
      userId: userId || 'unknown',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      isVisited: false
    };
  }

  return {
    id: visit.id.toString(),
    spaceId: visit.place_id.toString(),
    userId: userId,
    startTime: visit.visit_from,
    endTime: visit.visit_till,
    status: visit.is_visited ? 'confirmed' : 'pending',
    createdAt: new Date().toISOString(),
    isVisited: visit.is_visited,
  };
};

/**
 * Converts a VisitorPlaceVisitDTO to a Booking domain object
 */
export const visitorPlaceVisitToBooking = (visit: VisitorPlaceVisitDTO): Booking => {
  if (!visit) {
    console.error('Visit object is undefined in visitorPlaceVisitToBooking');
    // Return a default booking object to prevent errors
    return {
      id: 'error',
      spaceId: '0',
      userId: 'unknown',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      isVisited: false
    };
  }

  return {
    id: visit.id.toString(),
    spaceId: visit.place.id.toString(),
    userId: 'current-user', // We don't have user ID in this DTO
    startTime: visit.visit_from,
    endTime: visit.visit_till,
    status: visit.is_ended ? 'cancelled' : 'confirmed',
    createdAt: new Date().toISOString(),
    isVisited: visit.is_visited || false,
  };
};
