import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Circle, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';
import { Maximize } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config';
import { Place, Floor } from '../types';

interface FloorMapViewerCanvasProps {
  floors: Floor[];
  coworkingId: string;
}

const FloorMapViewerCanvas: React.FC<FloorMapViewerCanvasProps> = ({ floors, coworkingId }) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  
  // Load floor map image
  const [floorMapImage] = useImage(activeFloor?.mapImage || '');
  
  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
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
  
  // Handle wheel for zooming
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = scale;
    
    // Calculate new scale
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    // Calculate new scale with limits
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const limitedScale = Math.min(Math.max(0.1, newScale), 5);
    
    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    };
    
    setScale(limitedScale);
    setPosition(newPos);
  };
  
  // Handle stage drag start
  const handleStageDragStart = () => {
    setIsDragging(true);
  };
  
  // Handle stage drag end
  const handleStageDragEnd = (e: any) => {
    setIsDragging(false);
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };
  
  // Reset view
  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  // Calculate place position in canvas coordinates
  const getPlacePosition = (place: Place) => {
    const imageWidth = floorMapImage?.width || 1;
    const imageHeight = floorMapImage?.height || 1;
    
    return {
      x: (place.x / 100) * imageWidth,
      y: (place.y / 100) * imageHeight
    };
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
      
      {/* Canvas container */}
      <div 
        ref={containerRef}
        className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: '500px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          draggable={true}
          onDragStart={handleStageDragStart}
          onDragEnd={handleStageDragEnd}
          x={position.x}
          y={position.y}
        >
          <Layer>
            {/* Floor map image */}
            {floorMapImage && (
              <Image
                image={floorMapImage}
                scaleX={scale}
                scaleY={scale}
                listening={false}
              />
            )}
            
            {/* Places */}
            {activeFloor.places.map(place => {
              const isHovered = hoveredPlaceId === place.id;
              
              // Base size in pixels (will be multiplied by the size coefficient)
              const baseSize = 20 * place.size;
              const placePos = getPlacePosition(place);
              
              return (
                <Group
                  key={place.id}
                  x={placePos.x}
                  y={placePos.y}
                  onClick={() => handlePlaceClick(place)}
                  onMouseEnter={() => setHoveredPlaceId(place.id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                  cursor="pointer"
                >
                  {/* The actual point */}
                  <Circle
                    radius={baseSize/2}
                    fill={place.status === 'available' ? '#10b981' : '#ef4444'}
                    stroke="white"
                    strokeWidth={2}
                    shadowColor="black"
                    shadowBlur={3}
                    shadowOpacity={0.3}
                    shadowOffset={{ x: 1, y: 1 }}
                    scaleX={1/scale}
                    scaleY={1/scale}
                  />
                  
                  {/* Hover tooltip */}
                  {isHovered && (
                    <Group y={-baseSize/2 - 30} scaleX={1/scale} scaleY={1/scale}>
                      <Rect
                        x={-60}
                        y={-15}
                        width={120}
                        height={30}
                        fill="rgba(0,0,0,0.7)"
                        cornerRadius={4}
                      />
                      <Text
                        text={place.name}
                        fill="white"
                        fontSize={12}
                        fontStyle="bold"
                        align="center"
                        width={120}
                        x={-60}
                        y={-10}
                      />
                    </Group>
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
        
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
        
        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md text-xs text-gray-600 shadow-sm">
          {Math.round(scale * 100)}%
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
              <span>Этаж {activeFloor.level}, {activeFloor.name}</span>
            </div>
            
            {selectedPlace.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPlace.tags.map((tag, index) => (
                  <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm text-gray-700">
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

export default FloorMapViewerCanvas;