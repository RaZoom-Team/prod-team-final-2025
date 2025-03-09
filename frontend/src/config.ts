export const API_BASE_URL = 'https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api';

export const DEFAULT_ORGANIZATION_COLOR = '#3044FF';

// Predefined accent colors for organization settings
export const ACCENT_COLORS = [
  { value: '#3044FF', name: 'Синий' },
  { value: '#009B40', name: 'Зеленый' },
  { value: '#DB44E8', name: 'Фиолетовый' },
  { value: '#E63F07', name: 'Оранжевый' },
  { value: '#FFDD2D', name: 'Желтый' },
  { value: '#000000', name: 'Черный' }
] as const;

export const MAP_CONFIG = {
  defaultCenter: [55.751244, 37.618423], // Moscow coordinates
  defaultZoom: 12,
  minZoom: 10,
  maxZoom: 18,
  maxBoundsOffset: 0.05, // How much to extend beyond the coworking bounds (in degrees)
  apiKey: '0c5e45aa-56da-43ac-bac2-d5e5a583dec4', // Yandex Maps API key
  geocodingApiKey: 'YOUR_GEOCODING_API_KEY' // Замените на ваш ключ API для геокодинга
};

export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i}:00`,
}));

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ORGANIZATION_SETTINGS: '/admin/settings',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_COWORKINGS: '/admin/coworkings',
  ADMIN_COWORKING_EDIT: '/admin/coworkings/:id',
  ADMIN_SPACES: '/admin/spaces',
  COWORKING_MAP: '/coworkings',
  COWORKING_DETAILS: '/coworking/:id',
  COWORKING_FLOORS: '/coworking/:id/floors',
  SPACE_DETAILS: '/space/:id',
  BOOKING: '/booking/:spaceId',
  BOOKING_DETAILS: '/booking-details/:id',
};