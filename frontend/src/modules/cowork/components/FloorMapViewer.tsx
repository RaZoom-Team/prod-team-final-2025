import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Tag, Maximize } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config';
import { Place, Floor } from '../types';

interface FloorMapViewerProps {
  floors: Floor[];
  coworkingId: string;
}

const FloorMapViewer: React.FC<FloorMapViewerProps> = ({ floors, coworkingId }) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  
  // Handle place click
  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };
  
  // Handle booking
  const handleBookPlace = () => {
    if (!selectedPlace) return;
    navigate(ROUTES.BOOKING.replace(':spaceId', selectedPlace.id));
    setIsPlaceModalOpen(false);
  };
  
  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  // Handle pan move
  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart) return;
    
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    
    setMapPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  // Handle pan end
  const handlePanEnd = () => {
    setIsPanning(false);
    setPanStart(null);
  };
  
  // Reset pan position
  const handleResetView = () => {
    setMapPosition({ x: 0, y: 0 });
  };
  
  // Mouse move handler for panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && panStart) {
        handlePanMove({ clientX: e.clientX, clientY: e.clientY } as React.MouseEvent);
      }
    };
    
    const handleMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
    };
    
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  // Render place as a simple point
  const renderPlace = (place: Place) => {
    const isHovered = hoveredPlaceId === place.id;
    
    // Base size in pixels
    const baseSize = 20 * place.size;
    
    // Style for the point
    const style = {
      left: `${place.x}%`,
      top: `${place.y}%`,
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      zIndex: isHovered ? 10 : 1,
    };
    
    // Tooltip style
    const tooltipStyle = {
      position: 'absolute' as const,
      top: '-30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      opacity: isHovered ? 1 : 0,
      transition: 'opacity 0.2s',
    };
    
    return (
      <div 
        key={place.id}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 rounded-full shadow-md ${
          place.status === 'available' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
        } border-2 border-white`}
        style={style}
        onClick={() => handlePlaceClick(place)}
        onMouseEnter={() => setHoveredPlaceId(place.id)}
        onMouseLeave={() => setHoveredPlaceId(null)}
      >
        <div style={tooltipStyle}>
          {place.name}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Floor selector */}
      <div className="w-full bg-gray-100 p-2 flex overflow-x-auto no-scrollbar">
        {floors.map((floor, index) => (
          <button
            key={floor.id}
            className={`px-4 py-2 rounded-md mr-2 whitespace-nowrap ${
              index === activeFloorIndex 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveFloorIndex(index)}
          >
            {floor.name}
          </button>
        ))}
      </div>
      
      {/* Map container */}
      <div 
        ref={mapContainerRef}
        className={`relative ${isPanning ? 'cursor-move' : 'cursor-default'}`}
        style={{ height: '500px', overflow: 'hidden' }}
        onMouseDown={handlePanStart}
      >
        {/* Floor map image */}
        <div 
          style={{ 
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          <img 
            src={activeFloor.mapImage} 
            alt={`Floor plan for ${activeFloor.name}`}
            className="w-full h-full object-contain"
            style={{
              transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
            }}
          />
        </div>
        
        {/* Places */}
        {activeFloor.places.map(place => renderPlace(place))}
        
        {/* Reset view button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-100"
            onClick={handleResetView}
            title="Reset view"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
      
      {/* Place details modal */}
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
    </div>
  );
};

export default FloorMapViewer;