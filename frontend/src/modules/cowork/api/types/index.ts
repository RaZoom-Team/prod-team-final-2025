/**
 * API Data Types based on Swagger documentation
 */

// Building (Coworking) types
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
  open_from?: number | null;
  open_till?: number | null;
  address: string;
  x: number;
  y: number;
  images_id?: string[];
}

// Place types
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

// Floor types
export interface BuildingFloor {
  floor: number;
  image_id: string;
  places: PlaceDTO[];
  image_url: string;
}

export interface CreateSchemeDTO {
  floor: number;
  image_id: string;
  places?: CreatePlaceDTO[];
}

// Visitor (Booking) types
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
  id: number; // Visit ID
  place: PlaceDTO;
  is_ended: boolean;
  is_visited: boolean;
  is_feedbacked: boolean;
}

// File upload types
export interface UploadFileResponse {
  image_id: string;
  image_url: string;
}

// Error types
export interface HTTPErrorModel {
  error_code: number;
  http_code: number;
  message: string;
}

export interface HTTPValidationErrorModel extends HTTPErrorModel {
  detail: any[] | null;
}

// Application domain types
export interface CoworkingCreateParams {
  open_from: number | null
  open_till: number | null
  name?: string;
  description?: string;
  address?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  geoCoordinates?: [number, number];
  photoFiles?: File[];
  remove_photos: string[]
}

export interface CoworkingUpdateParams extends CoworkingCreateParams {
  id: string;
}

export interface FloorCreateParams {
  level: number;
  mapImage?: string;
  mapImageFile?: File | null;
}

export interface FloorUpdateParams extends Partial<FloorCreateParams> {
  mapImageFile?: File | null;
}

export interface PlaceCreateParams {
  name: string;
  tags?: string[];
  x: number;
  y: number;
  size?: number;
  rotation?: number;
  photo?: string;
  photoFile?: File;
  status?: 'available' | 'occupied';
  shape?: 'circle' | 'rectangle' | 'trapezoid';
}

export interface PlaceUpdateParams extends Partial<PlaceCreateParams> {
  photoFile?: File | null;
}

export interface BookingCreateParams {
  spaceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: string;
}
