import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Circle, Group, Rect, Text } from 'react-konva';
import useImage from 'use-image';
import { Plus, X, Maximize, Edit } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import FormField from '../../../shared/components/FormField';
import FileUpload from '../../../shared/components/FileUpload';
import { Floor, Place } from '../types';

interface FloorMapCanvasProps {
  floors: Floor[];
  isAdmin?: boolean;
  onPlaceCreate?: (place: Place, floorId: string) => void;
  onPlaceUpdate?: (place: Place, floorId: string) => void;
  onPlaceDelete?: (placeId: string, floorId: string) => void;
}

const FloorMapCanvas: React.FC<FloorMapCanvasProps> = ({ 
  floors, 
  isAdmin = false,
  onPlaceCreate,
  onPlaceUpdate,
  onPlaceDelete
}) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [isPlacingPoint, setIsPlacingPoint] = useState(false);
  const [tempPoint, setTempPoint] = useState<{ x: number, y: number } | null>(null);
  const [isConfirmCreateOpen, setIsConfirmCreateOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [draggingPlaceId, setDraggingPlaceId] = useState<string | null>(null);
  const [resizingPlaceId, setResizingPlaceId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [lastDragEndPos, setLastDragEndPos] = useState<{ x: number, y: number } | null>(null);
  
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  const activeFloorPlaces = activeFloor?.places || [];
  
  // Load floor map image
  const [floorMapImage] = useImage(activeFloor?.mapImage || '');
  
  // Initial form data for creating/editing places
  const initialFormData = {
    name: '',
    tags: '',
    size: 1.0,
    photo: '',
    photoFile: null as File | null,
  };
  
  const [formData, setFormData] = useState(initialFormData);
  
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
  
  // Reset form data when modal closes
  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) {
      setFormData(initialFormData);
    }
  }, [isCreateModalOpen, isEditModalOpen]);
  
  // Set form data when editing a place
  useEffect(() => {
    if (editingPlace) {
      setFormData({
        name: editingPlace.name,
        tags: editingPlace.tags.join(', '),
        size: editingPlace.size,
        photo: editingPlace.photo || '',
        photoFile: null,
      });
    }
  }, [editingPlace]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle number change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  // Handle photo change
  const handlePhotoChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, photoFile: file }));
  };
  
  // Handle stage click for placing points
  const handleStageClick = (e: any) => {
    if (!isPlacingPoint || !isAdmin) return;
    
    // Get click position relative to the stage
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Convert to the actual position in the image coordinates (considering scale and position)
    const x = (pointerPosition.x - position.x) / scale;
    const y = (pointerPosition.y - position.y) / scale;
    
    // Convert to percentage of the image size
    const imageWidth = floorMapImage?.width || 1;
    const imageHeight = floorMapImage?.height || 1;
    
    const xPercent = (x / imageWidth) * 100;
    const yPercent = (y / imageHeight) * 100;
    
    setTempPoint({ x: xPercent, y: yPercent });
    setIsConfirmCreateOpen(true);
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
  const handleStageDragStart = (e: any) => {
    if (isPlacingPoint || draggingPlaceId || resizingPlaceId) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }
    setIsDragging(true);
    setLastDragEndPos(null);
  };
  
  // Handle stage drag end
  const handleStageDragEnd = (e: any) => {
    if (isPlacingPoint || draggingPlaceId || resizingPlaceId) return;
    
    setIsDragging(false);
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
    setLastDragEndPos(null);
  };
  
  // Handle place drag start
  const handlePlaceDragStart = (e: any, place: Place) => {
    if (!isAdmin) return;
    
    // Prevent stage dragging when dragging a place
    e.cancelBubble = true;
    
    // Store the initial position for the place
    const placePos = getPlacePosition(place);
    setDragStartPos({
      x: placePos.x,
      y: placePos.y
    });
    
    setDraggingPlaceId(place.id);
    setSelectedPlaceId(place.id);
  };
  
  // Handle place drag move
  const handlePlaceDragMove = (e: any, place: Place) => {
    if (!isAdmin || !onPlaceUpdate || !dragStartPos) return;
    
    // Prevent stage dragging when dragging a place
    e.cancelBubble = true;
    
    // Get the pointer position
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Calculate the delta from the drag start position
    const deltaX = (pointerPosition.x - position.x) / scale - dragStartPos.x;
    const deltaY = (pointerPosition.y - position.y) / scale - dragStartPos.y;
    
    // Calculate the new position in percentage
    const imageWidth = floorMapImage?.width || 1;
    const imageHeight = floorMapImage?.height || 1;
    
    const newX = ((dragStartPos.x + deltaX) / imageWidth) * 100;
    const newY = ((dragStartPos.y + deltaY) / imageHeight) * 100;
    
    // Update the place in real-time
    onPlaceUpdate({
      ...place,
      x: Math.max(0, Math.min(100, newX)),
      y: Math.max(0, Math.min(100, newY))
    }, activeFloor.id);
  };
  
  // Handle place drag end
  const handlePlaceDragEnd = (e: any) => {
    // Prevent stage from moving after place drag ends
    e.cancelBubble = true;
    
    // Store the current stage position to prevent teleporting
    setLastDragEndPos({
      x: position.x,
      y: position.y
    });
    
    setDraggingPlaceId(null);
    setDragStartPos(null);
  };
  
  // Handle resize start
  const handleResizeStart = (e: any, place: Place) => {
    if (!isAdmin) return;
    
    // Prevent stage dragging when resizing a place
    e.cancelBubble = true;
    
    setResizingPlaceId(place.id);
    setSelectedPlaceId(place.id);
  };
  
  // Handle resize move
  const handleResizeMove = (e: any, place: Place) => {
    if (!isAdmin || !onPlaceUpdate || !resizingPlaceId) return;
    
    // Prevent stage dragging when resizing a place
    e.cancelBubble = true;
    
    // Get the pointer position
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Calculate the place center position in stage coordinates
    const placePos = getPlacePosition(place);
    const placeCenterX = placePos.x * scale + position.x;
    const placeCenterY = placePos.y * scale + position.y;
    
    // Calculate distance from place center to pointer
    const dx = pointerPosition.x - placeCenterX;
    const dy = pointerPosition.y - placeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate new size based on distance (scaled)
    const newSize = distance / (20 * scale);
    
    // Update the place in real-time
    onPlaceUpdate({
      ...place,
      size: Math.max(0.2, newSize)
    }, activeFloor.id);
  };
  
  // Handle resize end
  const handleResizeEnd = (e: any) => {
    // Prevent stage dragging when ending resize
    e.cancelBubble = true;
    
    // Store the current stage position to prevent teleporting
    setLastDragEndPos({
      x: position.x,
      y: position.y
    });
    
    setResizingPlaceId(null);
  };
  
  // Handle place click
  const handlePlaceClick = (e: any, place: Place) => {
    // Prevent stage click when clicking a place
    e.cancelBubble = true;
    
    if (isAdmin) {
      setSelectedPlaceId(place.id);
    }
  };
  
  // Handle cancel create
  const handleCancelCreate = () => {
    setIsConfirmCreateOpen(false);
    setTempPoint(null);
  };
  
  // Handle confirm create
  const handleConfirmCreate = () => {
    setIsConfirmCreateOpen(false);
    setIsCreateModalOpen(true);
  };
  
  // Handle create place
  const handleCreatePlace = () => {
    if (!tempPoint || !onPlaceCreate) return;
    
    const newPlace: Place = {
      id: `temp_${Date.now()}`, // Temporary ID, will be replaced by server
      name: formData.name,
      x: tempPoint.x,
      y: tempPoint.y,
      size: formData.size,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      photo: formData.photo,
      status: 'available',
      shape: 'circle',
      rotation: 0,
    };
    
    onPlaceCreate(newPlace, activeFloor.id);
    setIsCreateModalOpen(false);
    setTempPoint(null);
    setIsPlacingPoint(false);
  };
  
  // Handle edit place
  const handleEditPlace = (e: any) => {
    // Prevent bubbling to avoid triggering other handlers
    e.cancelBubble = true;
    
    if (!selectedPlaceId) return;
    
    const place = activeFloorPlaces.find(p => p.id === selectedPlaceId);
    if (!place) return;
    
    setEditingPlace(place);
    setIsEditModalOpen(true);
  };
  
  // Handle update place
  const handleUpdatePlace = () => {
    if (!editingPlace || !onPlaceUpdate) return;
    
    const updatedPlace: Place = {
      ...editingPlace,
      name: formData.name,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      shape: 'circle',
      size: formData.size,
    };
    
    onPlaceUpdate(updatedPlace, activeFloor.id);
    setIsEditModalOpen(false);
    setEditingPlace(null);
  };
  
  // Handle delete place
  const handleDeletePlace = () => {
    if (!editingPlace || !onPlaceDelete) return;
    
    if (window.confirm('Are you sure you want to delete this place?')) {
      onPlaceDelete(editingPlace.id, activeFloor.id);
      setIsEditModalOpen(false);
      setEditingPlace(null);
      setSelectedPlaceId(null);
    }
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
    <div>
      {/* Floor selector */}
      {floors.length > 1 && (
        <div className="w-full bg-gray-100 p-2 flex overflow-x-auto no-scrollbar mb-4">
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
      )}
      
      {/* Canvas container */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ height: '500px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onClick={handleStageClick}
          draggable={!isPlacingPoint && !draggingPlaceId && !resizingPlaceId}
          onDragStart={handleStageDragStart}
          onDragEnd={handleStageDragEnd}
          x={lastDragEndPos ? lastDragEndPos.x : position.x}
          y={lastDragEndPos ? lastDragEndPos.y : position.y}
          className={
            isPlacingPoint ? 'cursor-crosshair' : 
            isDragging ? 'cursor-grabbing' : 
            'cursor-grab'
          }
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
            {activeFloorPlaces.map(place => {
              const isSelected = selectedPlaceId === place.id;
              const isDragging = draggingPlaceId === place.id;
              const isResizing = resizingPlaceId === place.id;
              const isHovered = hoveredPlaceId === place.id;
              
              // Base size in pixels (will be multiplied by the size coefficient)
              const baseSize = 20 * place.size;
              const placePos = getPlacePosition(place);
              
              return (
                <Group
                  key={place.id}
                  x={placePos.x}
                  y={placePos.y}
                  onMouseDown={(e) => handlePlaceDragStart(e, place)}
                  onDragMove={(e) => handlePlaceDragMove(e, place)}
                  onDragEnd={handlePlaceDragEnd}
                  onClick={(e) => handlePlaceClick(e, place)}
                  onMouseEnter={() => setHoveredPlaceId(place.id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                  draggable={isAdmin}
                >
                  {/* Selection box */}
                  {isSelected && (
                    <Rect
                      x={-baseSize/2 - 6}
                      y={-baseSize/2 - 6}
                      width={baseSize + 12}
                      height={baseSize + 12}
                      stroke="white"
                      strokeWidth={2}
                      dash={[5, 5]}
                      cornerRadius={8}
                      listening={false}
                      scaleX={1/scale}
                      scaleY={1/scale}
                    />
                  )}
                  
                  {/* The actual point */}
                  <Circle
                    radius={baseSize/2}
                    fill={place.status === 'available' ? '#9ca3af' : '#ef4444'}
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
                  {isHovered && !isAdmin && (
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
                  
                  {/* Resize handle */}
                  {isSelected && isAdmin && (
                    <Group
                      x={baseSize/2 + 10}
                      y={baseSize/2 + 10}
                      onMouseDown={(e) => handleResizeStart(e, place)}
                      onMouseUp={handleResizeEnd}
                      onMouseMove={(e) => handleResizeMove(e, place)}
                      scaleX={1/scale}
                      scaleY={1/scale}
                    >
                      <Circle
                        radius={12}
                        fill="white"
                        shadowColor="black"
                        shadowBlur={3}
                        shadowOpacity={0.3}
                        shadowOffset={{ x: 1, y: 1 }}
                      />
                      <Circle
                        radius={4}
                        fill="var(--primary-color)"
                        x={0}
                        y={0}
                      />
                    </Group>
                  )}
                  
                  {/* Edit button */}
                  {isSelected && isAdmin && (
                    <Group
                      x={-baseSize/2 - 10}
                      y={-baseSize/2 - 10}
                      onClick={handleEditPlace}
                      scaleX={1/scale}
                      scaleY={1/scale}
                    >
                      <Circle
                        radius={12}
                        fill="white"
                        shadowColor="black"
                        shadowBlur={3}
                        shadowOpacity={0.3}
                        shadowOffset={{ x: 1, y: 1 }}
                      />
                      <Text
                        text="✎"
                        fill="var(--primary-color)"
                        fontSize={14}
                        fontStyle="bold"
                        align="center"
                        verticalAlign="middle"
                        x={-6}
                        y={-7}
                      />
                    </Group>
                  )}
                </Group>
              );
            })}
            
            {/* Temporary point */}
            {tempPoint && (
              <Circle
                x={(tempPoint.x / 100) * (floorMapImage?.width || 1)}
                y={(tempPoint.y / 100) * (floorMapImage?.height || 1)}
                radius={15}
                fill="var(--primary-color)"
                stroke="white"
                strokeWidth={2}
                opacity={0.7}
                scaleX={1/scale}
                scaleY={1/scale}
              />
            )}
          </Layer>
        </Stage>
        
        {/* Admin controls */}
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
            {/* Add place button */}
            <button
              className={`p-3 rounded-full shadow-md ${
                isPlacingPoint ? 'bg-primary text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setIsPlacingPoint(!isPlacingPoint)}
              title={isPlacingPoint ? 'Cancel placing' : 'Add new place'}
            >
              {isPlacingPoint ? <X size={20} /> : <Plus size={20} />}
            </button>
            
            {/* Reset view button */}
            <button
              className="p-3 rounded-full shadow-md bg-white text-gray-700"
              onClick={handleResetView}
              title="Reset view"
            >
              <Maximize size={20} />
            </button>
          </div>
        )}
        
        {/* User controls */}
        {!isAdmin && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
            {/* Reset view button */}
            <button
              className="p-3 rounded-full shadow-md bg-white text-gray-700"
              onClick={handleResetView}
              title="Reset view"
            >
              <Maximize size={20} />
            </button>
          </div>
        )}
        
        {/* Zoom indicator */}
        <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-md text-xs text-gray-600 shadow-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>
      
      {/* Confirm create modal */}
      <Modal
        isOpen={isConfirmCreateOpen}
        onClose={handleCancelCreate}
        title="Create place?"
        maxWidth="max-w-xs"
      >
        <div className="flex flex-col space-y-4">
          <p className="text-gray-600">
            Create a new place at this location?
          </p>
          <div className="flex space-x-2">
            <button
              className="btn-secondary flex-1"
              onClick={handleCancelCreate}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleConfirmCreate}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Create place modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTempPoint(null);
        }}
        title="Create new place"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <FormField
            label="Tags (comma separated)"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="e.g. desk, window, quiet zone"
          />
          
          <FormField
            label="Size (coefficient)"
            name="size"
            type="number"
            value={formData.size}
            onChange={handleNumberChange}
            step="0.1"
            min="0.1"
            max="3"
          />
          
          <FileUpload
            label="Photo (optional)"
            onChange={handlePhotoChange}
            value={formData.photo}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              className="btn-secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setTempPoint(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePlace}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Edit place modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlace(null);
        }}
        title="Edit place"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          
          <FormField
            label="Tags (comma separated)"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="e.g. desk, window, quiet zone"
          />
          
          <FormField
            label="Size (coefficient)"
            name="size"
            type="number"
            value={formData.size}
            onChange={handleNumberChange}
            step="0.1"
            min="0.1"
            max="3"
          />
          
          <FileUpload
            label="Photo (optional)"
            onChange={handlePhotoChange}
            value={formData.photo}
          />
          
          <div className="flex justify-between pt-4">
            <button
              className="btn-danger"
              onClick={handleDeletePlace}
            >
              Delete
            </button>
            
            <div className="flex space-x-2">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlace(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdatePlace}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FloorMapCanvas;