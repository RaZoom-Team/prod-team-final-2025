import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coworking } from '../types';
import { MAP_CONFIG } from '../../../config';
import { Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet with webpack/vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// User location marker icon
const userLocationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface LeafletMapProps {
  coworkings: Coworking[];
  onCoworkingSelect?: (coworking: Coworking) => void;
  onMapClick?: (coords: [number, number]) => void;
  selectedCoworking?: Coworking | null;
  height?: string;
  interactive?: boolean;
  showSearch?: boolean;
  sidebarPosition?: 'left' | 'right' | 'bottom';
  isAdmin?: boolean;
}

// Map controller component
const MapController = ({ 
  coworkings,
  maxBoundsOffset = 0.05,
  isAdmin = false
}: { 
  coworkings: Coworking[];
  maxBoundsOffset?: number;
  isAdmin?: boolean;
}) => {
  const map = useMap();
  
  // Set initial view
  useEffect(() => {
    if (coworkings.length === 0) return;

    // Получаем все валидные координаты
    const validCoworkings = coworkings.filter(c => c.geoCoordinates);
    
    if (validCoworkings.length === 0) return;

    // Выбираем случайный коворкинг для начального центрирования
    const randomIndex = Math.floor(Math.random() * validCoworkings.length);
    const randomCoworking = validCoworkings[randomIndex];

    // Устанавливаем начальный вид на случайный коворкинг
    map.setView(randomCoworking.geoCoordinates!, 15);

  }, [map, coworkings]);
  
  return null;
};

// Location tracker component
const LocationTracker = () => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  useMapEvents({
    locationfound: (e) => {
      const { lat, lng } = e.latlng;
      setUserLocation([lat, lng]);
      map.flyTo([lat, lng], 15);
    }
  });

  useEffect(() => {
    if (!userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    userMarkerRef.current = L.marker(userLocation, { icon: userLocationIcon })
      .addTo(map);

    const accuracyCircle = L.circle(userLocation, {
      radius: 100,
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      color: '#3b82f6',
      weight: 1
    }).addTo(map);

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      accuracyCircle.remove();
    };
  }, [map, userLocation]);

  useEffect(() => {
    const handleLocationEvent = () => {
      map.locate({ setView: false });
    };

    window.addEventListener('requestLocation', handleLocationEvent);

    return () => {
      window.removeEventListener('requestLocation', handleLocationEvent);
    };
  }, [map]);

  return null;
};

// Map click handler component
const MapClickHandler = ({ onMapClick }: { onMapClick?: (coords: [number, number]) => void }) => {
  const map = useMap();
  
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        const { lat, lng } = e.latlng;
        console.log("Клик на карте:", lat, lng);
        onMapClick([lat, lng]);
        
        const clickMarker = L.marker([lat, lng], {
          icon: createCustomIcon('#4f46e5')
        }).addTo(map);
        
        setTimeout(() => {
          map.removeLayer(clickMarker);
        }, 1000);
      }
    }
  });
  
  return null;
};

const LeafletMap: React.FC<LeafletMapProps> = ({
  coworkings,
  onCoworkingSelect,
  onMapClick,
  selectedCoworking,
  height = '500px',
  interactive = true,
  showSearch = false,
  sidebarPosition = 'right',
  isAdmin = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{[key: string]: L.Marker}>({});

  useEffect(() => {
    const removeAttributionPrefix = () => {
      if (!mapContainerRef.current) return;
      
      const attributionElements = mapContainerRef.current.querySelectorAll('.leaflet-control-attribution');
      attributionElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.innerHTML = element.innerHTML.replace('Leaflet', '');
        }
      });
    };

    const timers = [
      setTimeout(removeAttributionPrefix, 500),
      setTimeout(removeAttributionPrefix, 1000),
      setTimeout(removeAttributionPrefix, 2000)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [mapReady]);

  useEffect(() => {
    const fixMapRendering = () => {
      window.dispatchEvent(new Event('resize'));
    };
    
    const timers = [
      setTimeout(fixMapRendering, 100),
      setTimeout(fixMapRendering, 500),
      setTimeout(fixMapRendering, 1000),
      setTimeout(fixMapRendering, 2000)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [mapReady]);

  const handleMapLoad = (map: L.Map) => {
    setMapReady(true);
    mapRef.current = map;
  };

  useEffect(() => {
    if (!mapRef.current) return;
    
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};
    
    coworkings.forEach(coworking => {
      if (!coworking.geoCoordinates) return;
      
      const isSelected = selectedCoworking?.id === coworking.id;
      const markerIcon = createCustomIcon(isSelected ? 'var(--primary-color)' : '#ef4444');
      
      const marker = L.marker(coworking.geoCoordinates, {
        icon: markerIcon,
        draggable: isAdmin && isSelected,
      }).addTo(mapRef.current!);
      
      marker.on('click', () => {
        if (interactive && onCoworkingSelect) {
          onCoworkingSelect(coworking);
        }
      });
      
      if (isAdmin && isSelected) {
        marker.on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          if (onMapClick) {
            onMapClick([position.lat, position.lng]);
          }
        });
      }
      
      markersRef.current[coworking.id] = marker;
    });
  }, [coworkings, selectedCoworking, mapReady, interactive, onCoworkingSelect, isAdmin, onMapClick]);

  return (
    <div 
      ref={mapContainerRef}
      style={{ height, width: '100%', position: 'relative' }} 
      className="rounded-xl overflow-hidden leaflet-container-wrapper"
    >
      <MapContainer
        center={[0, 0]}
        zoom={0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        attributionControl={true}
        whenReady={(e) => handleMapLoad(e.target)}
        className="leaflet-map"
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        minZoom={1}
        maxZoom={MAP_CONFIG.maxZoom}
      >
        <MapController 
          coworkings={coworkings} 
          maxBoundsOffset={MAP_CONFIG.maxBoundsOffset}
          isAdmin={isAdmin}
        />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationTracker />
        
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      </MapContainer>
      
      {isAdmin && onMapClick && (
        <div className="bg-white bg-opacity-90 p-3 rounded-lg shadow-md text-sm mt-2">
          <p className="font-medium mb-1">Выберите местоположение коворкинга:</p>
          <ul className="list-disc list-inside text-gray-700">
            <li>Кликните на карте, чтобы установить маркер</li>
            <li>Перетащите маркер для точного позиционирования</li>
            <li>Используйте поиск адреса для быстрого перемещения</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;