import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Maximize, Edit } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import FormField from '../../../shared/components/FormField';
import FileUpload from '../../../shared/components/FileUpload';
import { Floor, Place } from '../types';
import { getOrganization } from '../../../modules/admin/api/organizationApi';
import { useQuery } from '@tanstack/react-query';

interface FloorMapProps {
  floors: Floor[];
  isAdmin?: boolean;
  onPlaceCreate?: (place: Place, floorId: string) => void;
  onPlaceUpdate?: (place: Place, floorId: string) => void;
  onPlaceDelete?: (placeId: string, floorId: string) => void;
}

const FloorMap: React.FC<FloorMapProps> = ({ 
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
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [draggingPlaceId, setDraggingPlaceId] = useState<string | null>(null);
  const [resizingPlaceId, setResizingPlaceId] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  const activeFloorPlaces = activeFloor?.places || [];

  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });
  
  // Initial form data for creating/editing places
  const initialFormData = {
    name: '',
    tags: '',
    size: 1.0,
    photo: '',
    photoFile: null as File | null,
  };
  
  const [formData, setFormData] = useState(initialFormData);
  
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
  
  // Handle map click
  const handleMapClick = (e: React.MouseEvent) => {
    if (!isPlacingPoint || !mapContainerRef.current || !isAdmin) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTempPoint({ x, y });
    setIsConfirmCreateOpen(true);
  };
  
  // Handle background click (to deselect)
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if not placing a point and not dragging
    if (!isPlacingPoint && !draggingPlaceId && !resizingPlaceId) {
      e.stopPropagation();
      setSelectedPlaceId(null);
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
  
  // Handle place click
  const handlePlaceClick = (e: React.MouseEvent, place: Place) => {
    e.stopPropagation();
    
    if (isAdmin) {
      setSelectedPlaceId(place.id);
    }
  };
  
  // Handle edit place
  const handleEditPlace = () => {
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
  
  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, place: Place) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingPlaceId(place.id);
    setSelectedPlaceId(place.id);
    
    // Store initial mouse position and place position
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialPlaceX = place.x;
    const initialPlaceY = place.y;
    
    // Function to handle mouse move during drag
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!mapContainerRef.current || !onPlaceUpdate) return;
      
      // Calculate delta in pixels
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;
      
      // Convert to percentage of container
      const rect = mapContainerRef.current.getBoundingClientRect();
      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;
      
      // Calculate new position
      const newX = Math.max(0, Math.min(100, initialPlaceX + deltaXPercent));
      const newY = Math.max(0, Math.min(100, initialPlaceY + deltaYPercent));
      
      // Update the place in real-time
      onPlaceUpdate({
        ...place,
        x: newX,
        y: newY
      }, activeFloor.id);
    };
    
    // Function to handle mouse up to end drag
    const handleMouseUp = () => {
      setDraggingPlaceId(null);
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, place: Place) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    
    setResizingPlaceId(place.id);
    setSelectedPlaceId(place.id);
    
    // Store initial mouse position and place size
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialSize = place.size;
    
    // Function to handle mouse move during resize
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!onPlaceUpdate) return;
      
      // Calculate distance from start position
      const dx = moveEvent.clientX - initialMouseX;
      const dy = moveEvent.clientY - initialMouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Determine if we're growing or shrinking
      const direction = dx > 0 || dy > 0 ? 1 : -1;
      
      // Scale factor - adjust this to control resize sensitivity
      const scaleFactor = 0.01;
      const newSize = Math.max(0.2, initialSize + direction * distance * scaleFactor);
      
      // Update the place in real-time
      onPlaceUpdate({
        ...place,
        size: newSize
      }, activeFloor.id);
    };
    
    // Function to handle mouse up to end resize
    const handleMouseUp = () => {
      setResizingPlaceId(null);
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    // Only start panning if not placing a point
    if (isPlacingPoint || draggingPlaceId || resizingPlaceId) return;
    
    // Don't allow panning for admin
    if (isAdmin) return;
    
    setIsPanning(true);
    
    // Store initial mouse position and map position
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialMapX = mapPosition.x;
    const initialMapY = mapPosition.y;
    
    // Function to handle mouse move during pan
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - initialMouseX;
      const dy = moveEvent.clientY - initialMouseY;
      
      setMapPosition({
        x: initialMapX + dx,
        y: initialMapY + dy
      });
    };
    
    // Function to handle mouse up to end pan
    const handleMouseUp = () => {
      setIsPanning(false);
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
              style={index === activeFloorIndex ? { backgroundColor: organization?.primaryColor } : undefined}
            >
              {floor.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapWrapperRef}
        className="relative"
        style={{ height: '500px', overflow: 'hidden' }}
        onMouseDown={handlePanStart}
      >
        <div
          ref={mapContainerRef}
          className={`absolute inset-0 ${
            draggingPlaceId ? 'cursor-grabbing' : 
            isPlacingPoint ? 'cursor-crosshair' : 
            isPanning ? 'cursor-move' : 'cursor-default'
          }`}
          onClick={handleMapClick}
        >
          {/* Floor map image */}
          <div 
            style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              transformOrigin: 'center',
            }}
          >
            <img 
              src={activeFloor.mapImage} 
              alt={`Floor plan for ${activeFloor.name}`}
              className="w-full h-full object-contain"
              style={{
                transform: isAdmin ? 'none' : `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
              }}
              onClick={handleBackgroundClick}
            />
          </div>
          
          {/* Places */}
          {activeFloorPlaces.map(place => {
            const isSelected = selectedPlaceId === place.id;
            const isDragging = draggingPlaceId === place.id;
            const isResizing = resizingPlaceId === place.id;
            
            // Base size in pixels (will be multiplied by the size coefficient)
            const baseSize = 20 * place.size;
            
            return (
              <div
                key={place.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  isDragging || isResizing ? 'z-50' : isSelected ? 'z-40' : 'z-10'
                }`}
                style={{
                  left: `${place.x}%`,
                  top: `${place.y}%`,
                  cursor: isAdmin ? 'grab' : 'pointer',
                }}
                onClick={(e) => handlePlaceClick(e, place)}
                onMouseDown={(e) => handleDragStart(e, place)}
              >
                {/* Selection box */}
                {isSelected && (
                  <div 
                    className="absolute border-2 border-dashed border-white rounded-md pointer-events-none"
                    style={{ 
                      zIndex: -1,
                      top: `-12px`,
                      left: `-12px`,
                      right: `-12px`,
                      bottom: `-12px`,
                    }}
                  />
                )}
                
                {/* The actual point */}
                <div
                  className={`rounded-full shadow-md ${
                    place.status === 'available' ? 'bg-gray-400' : 'bg-red-500'
                  } border-2 border-white`}
                  style={{
                    width: `${baseSize}px`,
                    height: `${baseSize}px`,
                    backgroundColor: place.status === 'available' ? 
                      (organization?.primaryColor || '#4f46e5') : '#ef4444'
                  }}
                />
                
                {/* Resize handle */}
                {isSelected && isAdmin && (
                  <div 
                    className="absolute w-8 h-8 bg-white rounded-full shadow-md cursor-nwse-resize flex items-center justify-center"
                    style={{
                      right: `-4px`,
                      bottom: `-4px`,
                      transform: 'translate(0, 0)',
                    }}
                    onMouseDown={(e) => handleResizeStart(e, place)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: organization?.primaryColor || '#4f46e5' }}
                    />
                  </div>
                )}
                
                {/* Edit button */}
                {isSelected && isAdmin && (
                  <div 
                    className="absolute w-8 h-8 bg-white rounded-full shadow-md cursor-pointer flex items-center justify-center"
                    style={{
                      left: `-4px`,
                      top: `-4px`,
                      transform: 'translate(0, 0)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPlace();
                    }}
                  >
                    <Edit 
                      size={16} 
                      style={{ color: organization?.primaryColor || '#4f46e5' }}
                      className="text-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Temporary point */}
          {tempPoint && (
            <div 
              className="absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse border-2 border-white"
              style={{ 
                left: `${tempPoint.x}%`, 
                top: `${tempPoint.y}%`,
                backgroundColor: organization?.primaryColor || '#4f46e5'
              }}
            />
          )}
        </div>
        
        {/* Admin controls */}
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
            {/* Add place button */}
            <button
              className={`p-3 rounded-full shadow-md ${
                isPlacingPoint ? 'text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setIsPlacingPoint(!isPlacingPoint)}
              title={isPlacingPoint ? 'Cancel placing' : 'Add new place'}
              style={isPlacingPoint ? { backgroundColor: organization?.primaryColor } : undefined}
            >
              {isPlacingPoint ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        )}
        
        {/* User controls */}
        {!isAdmin && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
            {/* Reset view button */}
            <button
              className="p-3 rounded-full shadow-md bg-white text-gray-700"
              onClick={() => setMapPosition({ x: 0, y: 0 })}
              title="Reset view"
            >
              <Maximize size={20} />
            </button>
          </div>
        )}
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
              style={{ backgroundColor: organization?.primaryColor }}
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
              style={{ backgroundColor: organization?.primaryColor }}
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
                style={{ backgroundColor: organization?.primaryColor }}
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

export default FloorMap;