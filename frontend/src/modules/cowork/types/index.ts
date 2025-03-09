export interface Coworking {
  id: string;
  name: string;
  description: string;
  address: string;
  coordinates: {
    x: number;
    y: number;
  };
  geoCoordinates?: [number, number]; // Latitude, Longitude for maps
  photos: string[];
  organizationId: string;
  floors?: Floor[];
  open_from?: number | null; // Opening hour (0-23)
  open_till?: number | null; // Closing hour (0-23)
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  mapImage: string;
  places: Place[];
}

export interface Place {
  id: string;
  name: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  size: number; // Size coefficient
  tags: string[];
  photo?: string;
  status: 'available' | 'occupied';
  shape: 'circle' | 'rectangle' | 'trapezoid';
  rotation?: number;
  opacity?: number; // For visual filtering
  disabled?: boolean; // To make unavailable places non-clickable
}

export interface Space {
  id: string;
  name: string;
  description: string;
  photo?: string;
  floor?: number;
  coworkingId: string;
  status: 'available' | 'occupied';
}

export interface Booking {
  id: string;
  spaceId: string;
  userId: string;
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string; // ISO date string
  isVisited?: boolean; // Whether the booking has been visited
}