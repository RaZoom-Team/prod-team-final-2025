import React, { useState, useEffect } from 'react';
import { Coworking } from '../types';
import { MAP_CONFIG } from '../../../config';

interface YandexMapProps {
  coworkings: Coworking[];
  onCoworkingSelect?: (coworking: Coworking) => void;
  onMapClick?: (coords: [number, number]) => void;
  selectedCoworking?: Coworking | null;
  height?: string;
  interactive?: boolean;
  showSearch?: boolean;
}

const YandexMap: React.FC<YandexMapProps> = ({
  coworkings,
  onCoworkingSelect,
  onMapClick,
  selectedCoworking,
  height = '500px',
  interactive = true,
  showSearch = false,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [ymaps, setYmaps] = useState<any>(null);
  
  // Convert legacy coordinates to geo coordinates if needed
  const mapCoworkings = coworkings.map(coworking => {
    if (!coworking.geoCoordinates) {
      // This is just a placeholder. In a real app, you'd use proper conversion
      return {
        ...coworking,
        geoCoordinates: [55.751244 + (Math.random() - 0.5) * 0.05, 37.618423 + (Math.random() - 0.5) * 0.05]
      };
    }
    return coworking;
  });

  useEffect(() => {
    // Check if ymaps is already available
    if (window.ymaps && !mapLoaded) {
      setMapLoaded(true);
      setYmaps(window.ymaps);
      initMap();
    } else if (!window.ymaps) {
      // Load Yandex Maps API if not already loaded
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${MAP_CONFIG.apiKey}&lang=en_US`;
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(() => {
          setMapLoaded(true);
          setYmaps(window.ymaps);
          initMap();
        });
      };
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    if (mapInstance && selectedCoworking?.geoCoordinates) {
      mapInstance.setCenter(selectedCoworking.geoCoordinates, 15);
    }
  }, [selectedCoworking, mapInstance]);

  const initMap = () => {
    if (!mapLoaded || !ymaps) return;
    
    const mapContainer = document.getElementById('yandex-map');
    if (!mapContainer) return;
    
    // Calculate bounds from all coworking locations
    const bounds = calculateBounds(mapCoworkings);
    
    const map = new ymaps.Map(mapContainer, {
      center: MAP_CONFIG.defaultCenter,
      zoom: MAP_CONFIG.defaultZoom,
      controls: showSearch ? ['zoomControl', 'searchControl', 'geolocationControl'] : ['zoomControl', 'geolocationControl'],
      restrictMapArea: bounds // Restrict map to coworking areas
    });
    
    setMapInstance(map);
    
    // Add click handler
    if (interactive && onMapClick) {
      map.events.add('click', (e: any) => {
        const coords = e.get('coords');
        onMapClick([coords[0], coords[1]]);
      });
    }
    
    // Add placemarks for coworkings
    mapCoworkings.forEach(coworking => {
      if (!coworking.geoCoordinates) return;
      
      const placemark = new ymaps.Placemark(coworking.geoCoordinates, {
        hintContent: coworking.name,
        balloonContentHeader: coworking.name,
        balloonContentBody: `
          <div>
            <img src="${coworking.photos[0]}" alt="${coworking.name}" style="width: 200px; height: 120px; object-fit: cover; margin-bottom: 10px; border-radius: 4px;" />
            <p>${coworking.address}</p>
          </div>
        `,
        balloonContentFooter: `<a href="#/coworking/${coworking.id}" style="color: var(--primary-color); font-weight: 500;">View Details</a>`,
      }, {
        preset: selectedCoworking?.id === coworking.id 
          ? 'islands#blueCircleDotIconWithCaption' 
          : 'islands#redCircleDotIconWithCaption',
        iconColor: selectedCoworking?.id === coworking.id ? 'var(--primary-color)' : '#ef4444',
        draggable: false,
        openBalloonOnClick: interactive,
      });
      
      if (interactive && onCoworkingSelect) {
        placemark.events.add('click', () => {
          onCoworkingSelect(coworking);
        });
      }
      
      map.geoObjects.add(placemark);
    });
  };

  // Calculate bounds from coworking locations with padding
  const calculateBounds = (coworkings: Coworking[]): number[][] => {
    if (coworkings.length === 0) {
      // Default bounds around Moscow if no coworkings
      return [
        [55.70, 37.50], // Southwest
        [55.80, 37.70]  // Northeast
      ];
    }
    
    // Filter out coworkings without geoCoordinates
    const validCoworkings = coworkings.filter(c => c.geoCoordinates);
    
    if (validCoworkings.length === 0) {
      // Default bounds around Moscow if no valid coworkings
      return [
        [55.70, 37.50], // Southwest
        [55.80, 37.70]  // Northeast
      ];
    }
    
    // Calculate bounds from all coworking locations
    const latitudes = validCoworkings.map(c => c.geoCoordinates![0]);
    const longitudes = validCoworkings.map(c => c.geoCoordinates![1]);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    // Add padding
    const padding = MAP_CONFIG.maxBoundsOffset || 0.05;
    
    // Ensure minimum size for bounds
    const minSize = 0.02;
    const latDiff = Math.max(maxLat - minLat, minSize);
    const lngDiff = Math.max(maxLng - minLng, minSize);
    
    return [
      [minLat - latDiff * padding, minLng - lngDiff * padding], // Southwest
      [maxLat + latDiff * padding, maxLng + lngDiff * padding]  // Northeast
    ];
  };

  useEffect(() => {
    if (mapLoaded && ymaps) {
      initMap();
    }
  }, [mapLoaded, ymaps, coworkings, selectedCoworking]);

  return (
    <div 
      id="yandex-map" 
      className="rounded-lg overflow-hidden" 
      style={{ height, width: '100%' }}
    ></div>
  );
};

// Add this to make TypeScript happy with the global ymaps object
declare global {
  interface Window {
    ymaps: any;
  }
}

export default YandexMap;