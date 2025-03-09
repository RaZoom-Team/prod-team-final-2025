import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize, Tag, MapPin } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import BottomSheet from '../../../shared/components/BottomSheet';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config';
import { Place, Floor } from '../types';

interface FloorMapViewerLeafletProps {
  floors: Floor[];
  coworkingId: string;
}

// Map controller component
const MapController = ({ 
  onResize 
}: { 
  onResize: (width: number, height: number) => void; 
}) => {
  const map = useMap();
  
  useMapEvents({
    resize: () => {
      const size = map.getSize();
      onResize(size.x, size.y);
    }
  });
  
  return null;
};

// Place markers component that updates when the map moves
const PlaceMarkers = ({
  places,
  onPlaceClick,
  imageBounds
}: {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  imageBounds: L.LatLngBoundsExpression;
}) => {
  const map = useMap();
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  
  // Update markers when map moves
  useMapEvents({
    moveend: updateMarkers,
    zoomend: updateMarkers
  });
  
  // Initial marker creation
  useEffect(() => {
    updateMarkers();
    return () => {
      // Clean up markers when component unmounts
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, [places, imageBounds]);
  
  // Update marker positions based on current map view
  function updateMarkers() {
    // Get the current image bounds in pixel coordinates
    const bounds = L.latLngBounds(imageBounds);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
    
    // Create new markers at correct positions
    places.forEach(place => {
      // Calculate position based on percentage coordinates
      // X and Y are percentages of the image width/height
      const lat = sw.lat + (ne.lat - sw.lat) * (1 - place.y / 100);
      const lng = sw.lng + (ne.lng - sw.lng) * (place.x / 100);
      
      // Create marker with custom icon
      const baseSize = 20 * place.size;
      const opacity = place.opacity !== undefined ? place.opacity : 1;
      const isDisabled = place.disabled === true;
      
      const icon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div class="relative">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md ${
              place.status === 'available' ? 'bg-green-500' : 'bg-red-500'
            } border-2 border-white" style="width: ${baseSize}px; height: ${baseSize}px; opacity: ${opacity};"></div>
          </div>
        `,
        iconSize: [baseSize, baseSize],
        iconAnchor: [baseSize/2, baseSize/2],
      });
      
      const marker = L.marker([lat, lng], { 
        icon,
        interactive: !isDisabled
      }).addTo(map);
      
      // Add event listeners only if place is not disabled
      if (!isDisabled) {
        marker.on('click', () => {
          onPlaceClick(place);
        });
        
        marker.on('mouseover', () => {
          setHoveredPlaceId(place.id);
          
          // Show tooltip
          const tooltipContent = `<div class="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">${place.name}</div>`;
          marker.bindTooltip(tooltipContent, { 
            permanent: true,
            direction: 'top',
            offset: [0, -baseSize/2 - 5],
            className: 'leaflet-tooltip-custom'
          }).openTooltip();
        });
        
        marker.on('mouseout', () => {
          setHoveredPlaceId(null);
          marker.closeTooltip();
          marker.unbindTooltip();
        });
      }
      
      // Store marker reference
      markersRef.current[place.id] = marker;
    });
  }
  
  return null;
};

// Custom component to handle floor image changes
const FloorImageOverlay = ({ 
  floorImage, 
  imageBounds 
}: { 
  floorImage: string; 
  imageBounds: L.LatLngBoundsExpression;
}) => {
  const map = useMap();
  const [image] = useState(floorImage);
  
  // Force map to redraw when floor changes
  useEffect(() => {
    map.invalidateSize();
  }, [floorImage, map]);
  
  return (
    <ImageOverlay
      url={image}
      bounds={imageBounds}
    />
  );
};

const FloorMapViewerLeaflet: React.FC<FloorMapViewerLeafletProps> = ({ floors, coworkingId }) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mapKey, setMapKey] = useState(0); // Key to force remount of map components
  
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  
  // Preload floor image to get its dimensions
  useEffect(() => {
    if (activeFloor?.mapImage) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = activeFloor.mapImage;
    }
  }, [activeFloor]);
  
  // Check if device is mobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle floor change
  const handleFloorChange = (index: number) => {
    setActiveFloorIndex(index);
    setMapKey(prev => prev + 1); // Force remount of map components
    
    // Reset view when changing floors
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.setView([0, 0], 0);
        mapRef.current?.fitBounds(getImageBounds());
        mapRef.current?.invalidateSize();
      }, 10);
    }
  };
  
  // Handle place click
  const handlePlaceClick = (place: Place) => {
    // Skip if place is disabled
    if (place.disabled) return;
    
    setSelectedPlace(place);
    if (isMobile) {
      setIsBottomSheetOpen(true);
    } else {
      setIsPlaceModalOpen(true);
    }
  };
  
  // Handle booking
  const handleBookPlace = () => {
    if (!selectedPlace) return;
    navigate(ROUTES.BOOKING.replace(':spaceId', selectedPlace.id));
    setIsPlaceModalOpen(false);
    setIsBottomSheetOpen(false);
  };
  
  // Reset view
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([0, 0], 0);
      mapRef.current.fitBounds(getImageBounds());
      mapRef.current.invalidateSize();
    }
  };
  
  // Handle map resize
  const handleMapResize = (width: number, height: number) => {
    setMapSize({ width, height });
  };
  
  // Calculate image bounds based on image dimensions
  const getImageBounds = (): L.LatLngBoundsExpression => {
    // Use the actual image dimensions if available
    if (imageSize.width > 0 && imageSize.height > 0) {
      // Calculate the aspect ratio
      const aspectRatio = imageSize.width / imageSize.height;
      
      // Determine the bounds based on aspect ratio
      // We use a coordinate system where 0,0 is the center
      const height = 100;
      const width = height * aspectRatio;
      
      return [
        [-height/2, -width/2], // Southwest corner
        [height/2, width/2]    // Northeast corner
      ];
    }
    
    // Default bounds if image dimensions are not available
    return [
      [-100, -100], // Southwest corner
      [100, 100]    // Northeast corner
    ];
  };
  
  // Preload floor images
  useEffect(() => {
    floors.forEach(floor => {
      const img = new Image();
      img.src = floor.mapImage;
    });
  }, [floors]);
  
  return (
    <div className="bg-white h-full flex flex-col">
      <div 
        ref={containerRef}
        className="relative flex-grow"
        style={{ overflow: 'hidden' }}
      >
        <MapContainer
          key={mapKey}
          center={[0, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
          whenReady={(e) => { mapRef.current = e.target; }}
          maxBounds={[[-150, -150], [150, 150]]}
          maxBoundsViscosity={1.0}
        >
          {/* Floor map image */}
          <FloorImageOverlay
            floorImage={activeFloor?.mapImage || ''}
            imageBounds={getImageBounds()}
          />
          
          {/* Places */}
          <PlaceMarkers 
            places={activeFloor.places} 
            onPlaceClick={handlePlaceClick}
            imageBounds={getImageBounds()}
          />
          
          {/* Map controller */}
          <MapController
            onResize={handleMapResize}
          />
        </MapContainer>
        
        {/* Floor selector - vertical on the right side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[1000] bg-white rounded-lg shadow-md">
          <div className="flex flex-col">
            {floors.map((floor, index) => (
              <button
                key={floor.id}
                className={`p-3 ${
                  index === activeFloorIndex 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                onClick={() => handleFloorChange(index)}
              >
                {floor.level}
              </button>
            ))}
          </div>
        </div>
        
        {/* Reset view button */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button
            onClick={handleResetView}
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-100"
            title="Reset view"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Desktop: Place details modal */}
      {!isMobile && (
        <Modal
          isOpen={isPlaceModalOpen}
          onClose={() => setIsPlaceModalOpen(false)}
          title={selectedPlace?.name || 'Место'}
          maxWidth="max-w-md"
        >
          {selectedPlace && (
            <div className="space-y-4">
              {selectedPlace.photo && (
                <img 
                  src={selectedPlace.photo} 
                  alt={selectedPlace.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div className="flex items-center text-gray-600">
                <MapPin size={18} className="mr-2" />
                <span>Этаж {activeFloor.level}, {activeFloor.name}</span>
              </div>
              
              {selectedPlace.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPlace.tags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm text-gray-700">
                      <Tag size={14} className="mr-1" />
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4">
                <button
                  className={`w-full ${
                    selectedPlace.status === 'available' 
                      ? 'btn-primary' 
                      : 'btn-secondary cursor-not-allowed'
                  }`}
                  onClick={handleBookPlace}
                  disabled={selectedPlace.status !== 'available'}
                >
                  {selectedPlace.status === 'available' 
                    ? 'Забронировать' 
                    : 'Место занято'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Mobile: Place details bottom sheet */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={selectedPlace?.name || 'Место'}
      >
        {selectedPlace && (
          <div className="space-y-4 pb-4">
            {selectedPlace.photo && (
              <img 
                src={selectedPlace.photo} 
                alt={selectedPlace.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            <div className="flex items-center text-gray-600">
              <MapPin size={18} className="mr-2" />
              <span>Этаж {activeFloor.level}, {activeFloor.name}</span>
            </div>
            
            {selectedPlace.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPlace.tags.map((tag, index) => (
                  <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm text-gray-700">
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-4">
              <button
                className={`w-full ${
                  selectedPlace.status === 'available' 
                      ? 'btn-primary' 
                      : 'btn-secondary cursor-not-allowed'
                  }`}
                  onClick={handleBookPlace}
                  disabled={selectedPlace.status !== 'available'}
                >
                  {selectedPlace.status === 'available' 
                    ? 'Забронировать' 
                    : 'Место занято'}
                </button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    );
};

export default FloorMapViewerLeaflet;