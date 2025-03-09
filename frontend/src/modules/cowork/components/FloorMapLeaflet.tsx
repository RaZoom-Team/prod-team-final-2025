import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, X, Maximize, Check } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import FormField from '../../../shared/components/FormField';
import FileUpload from '../../../shared/components/FileUpload';
import { Floor, Place } from '../types';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../../modules/admin/api/organizationApi';

interface FloorMapLeafletProps {
  floors: Floor[];
  isAdmin?: boolean;
  onPlaceCreate?: (place: Place, floorId: string) => void;
  onPlaceUpdate?: (place: Place, floorId: string) => void;
  onPlaceDelete?: (placeId: string, floorId: string) => void;
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
  selectedPlaceId,
  isAdmin,
  onPlaceClick,
  onEditClick,
  imageBounds,
  accentColor
}: {
  places: Place[];
  selectedPlaceId: string | null;
  isAdmin: boolean;
  onPlaceClick: (place: Place) => void;
  onEditClick?: (place: Place) => void;
  imageBounds: L.LatLngBoundsExpression;
  accentColor?: string;
}) => {
  const map = useMap();
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  
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
  }, [places, selectedPlaceId, imageBounds, accentColor]);
  
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
      
      const isSelected = selectedPlaceId === place.id;
      
      // Create marker with custom icon
      const baseSize = 20 * place.size;
      const icon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div class="relative">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md ${
              place.status === 'available' ? 'bg-gray-400' : 'bg-red-500'
            } border-2 border-white" style="width: ${baseSize}px; height: ${baseSize}px; background-color: ${
              place.status === 'available' ? (accentColor || '#4f46e5') : '#ef4444'
            }"></div>
            ${isSelected ? `
              <div class="absolute -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white rounded-full pointer-events-none" 
                style="width: ${baseSize + 24}px; height: ${baseSize + 24}px; top: 0; left: 0;"></div>
            ` : ''}
            ${isSelected && isAdmin ? `
              <div class="absolute flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md cursor-pointer edit-button" style="top: -16px; left: -16px; transform: translate(0, 0);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${accentColor || '#4f46e5'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
            ` : ''}
            ${isSelected && isAdmin ? `
              <div class="absolute flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-md cursor-nwse-resize resize-handle" style="bottom: -16px; right: -16px; transform: translate(0, 0);">
                <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${accentColor || '#4f46e5'};"></div>
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [baseSize, baseSize],
        iconAnchor: [baseSize/2, baseSize/2],
        zIndexOffset: isSelected ? 1000 : 0
      });
      
      const marker = L.marker([lat, lng], { 
        icon,
        interactive: true,
        draggable: isAdmin
      }).addTo(map);
      
      // Add event listeners
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onPlaceClick(place);
      });
      
      // Add drag events for admin
      if (isAdmin) {
        marker.on('dragend', (e) => {
          if (!onEditClick) return;
          
          // Get new position
          const newPos = e.target.getLatLng();
          
          // Convert back to percentage
          const newLat = (newPos.lat - sw.lat) / (ne.lat - sw.lat);
          const newLng = (newPos.lng - sw.lng) / (ne.lng - sw.lng);
          
          // Update place
          const updatedPlace = {
            ...place,
            x: newLng * 100,
            y: (1 - newLat) * 100
          };
          
          onEditClick(updatedPlace);
        });
      }
      
      // Add event listeners for edit button
      setTimeout(() => {
        const markerElement = marker.getElement();
        if (markerElement && isAdmin && onEditClick) {
          const editButton = markerElement.querySelector('.edit-button');
          if (editButton) {
            editButton.addEventListener('click', (e) => {
              e.stopPropagation();
              onEditClick(place);
            });
          }
          
          // Add resize handle functionality
          const resizeHandle = markerElement.querySelector('.resize-handle');
          if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              
              // Initial position and size
              const initialMouseX = e.clientX;
              const initialMouseY = e.clientY;
              const initialSize = place.size;
              
              // Function to handle mouse move during resize
              const handleMouseMove = (moveEvent: MouseEvent) => {
                // Calculate distance from start position
                const dx = moveEvent.clientX - initialMouseX;
                const dy = moveEvent.clientY - initialMouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Determine if we're growing or shrinking
                const direction = dx > 0 || dy > 0 ? 1 : -1;
                
                // Scale factor - adjust this to control resize sensitivity
                const scaleFactor = 0.01;
                const newSize = Math.max(0.2, initialSize + direction * distance * scaleFactor);
                
                // Update the place
                const updatedPlace = {
                  ...place,
                  size: newSize
                };
                
                onEditClick(updatedPlace);
              };
              
              // Function to handle mouse up to end resize
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Add event listeners
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            });
          }
        }
      }, 0);
      
      // Store marker reference
      markersRef.current[place.id] = marker;
    });
  }
  
  return null;
};

// Temporary marker component
const TempMarker = ({ 
  position, 
  onConfirm, 
  onCancel,
  imageBounds,
  accentColor
}: { 
  position: L.LatLng; 
  onConfirm: () => void; 
  onCancel: () => void;
  imageBounds: L.LatLngBoundsExpression;
  accentColor?: string;
}) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    if (!markerRef.current) {
      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-temp-marker',
        html: `
          <div class="relative">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md" style="width: 20px; height: 20px; background-color: ${accentColor || '#4f46e5'};"></div>
            <div class="absolute -translate-x-1/2 -translate-y-1/2 flex space-x-2" style="top: -30px;">
              <button class="confirm-btn flex items-center justify-center bg-green-500 text-white rounded-full p-2 shadow-md w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button class="cancel-btn flex items-center justify-center bg-red-500 text-white rounded-full p-2 shadow-md w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      // Create marker
      const marker = L.marker(position, { 
        icon,
        interactive: true
      }).addTo(map);
      
      // Add event listeners for buttons
      setTimeout(() => {
        const markerElement = marker.getElement();
        if (markerElement) {
          const confirmBtn = markerElement.querySelector('.confirm-btn');
          if (confirmBtn) {
            confirmBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              onConfirm();
            });
          }
          
          const cancelBtn = markerElement.querySelector('.cancel-btn');
          if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              onCancel();
            });
          }
        }
      }, 0);
      
      markerRef.current = marker;
    }
    
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, position, onConfirm, onCancel, accentColor]);
  
  return null;
};

// Map events component
const MapEvents = ({ 
  isPlacingPoint, 
  onMapClick 
}: { 
  isPlacingPoint: boolean; 
  onMapClick: (e: L.LeafletMouseEvent) => void; 
}) => {
  const map = useMap();
  
  useMapEvents({
    click: (e) => {
      if (isPlacingPoint) {
        onMapClick(e);
      }
    }
  });
  
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
  
  // Force map to redraw when floor changes
  useEffect(() => {
    map.invalidateSize();
  }, [floorImage, map]);
  
  return (
    <ImageOverlay
      url={floorImage}
      bounds={imageBounds}
    />
  );
};

const FloorMapLeaflet: React.FC<FloorMapLeafletProps> = ({ 
  floors, 
  isAdmin = false,
  onPlaceCreate,
  onPlaceUpdate,
  onPlaceDelete
}) => {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [isPlacingPoint, setIsPlacingPoint] = useState(false);
  const [tempPoint, setTempPoint] = useState<L.LatLng | null>(null);
  const [tempPointPercentage, setTempPointPercentage] = useState<{x: number, y: number} | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [mapKey, setMapKey] = useState(0); // Key to force remount of map components
  
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const activeFloor = floors[activeFloorIndex];
  const activeFloorPlaces = activeFloor?.places || [];

  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });
  
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
  
  // Handle floor change
  const handleFloorChange = (index: number) => {
    setActiveFloorIndex(index);
    setMapKey(prev => prev + 1); // Force remount of map components
    setSelectedPlaceId(null);
    setTempPoint(null);
    setTempPointPercentage(null);
    setIsPlacingPoint(false);
  };
  
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
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isPlacingPoint || !isAdmin) return;
    
    // Store the actual latlng position for the marker
    setTempPoint(e.latlng);
    
    // Convert to percentage coordinates for later use
    const percentageCoords = latLngToPercentage(e.latlng);
    setTempPointPercentage(percentageCoords);
  };
  
  // Convert latitude/longitude to percentage coordinates
  const latLngToPercentage = (latlng: L.LatLng): { x: number, y: number } => {
    const bounds = L.latLngBounds(getImageBounds());
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    // Calculate percentage coordinates
    const x = ((latlng.lng - sw.lng) / (ne.lng - sw.lng)) * 100;
    const y = ((ne.lat - latlng.lat) / (ne.lat - sw.lat)) * 100;
    
    return { x, y };
  };
  
  // Handle place click
  const handlePlaceClick = (place: Place) => {
    if (isAdmin) {
      setSelectedPlaceId(place.id);
    }
  };
  
  // Handle temp marker confirm
  const handleTempMarkerConfirm = () => {
    setIsCreateModalOpen(true);
  };
  
  // Handle temp marker cancel
  const handleTempMarkerCancel = () => {
    setTempPoint(null);
    setTempPointPercentage(null);
  };
  
  // Handle create place
  const handleCreatePlace = () => {
    if (!tempPointPercentage || !onPlaceCreate) return;
    
    const newPlace: Place = {
      id: `temp_${Date.now()}`, // Temporary ID, will be replaced by server
      name: formData.name,
      x: tempPointPercentage.x,
      y: tempPointPercentage.y,
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
    setTempPointPercentage(null);
    setIsPlacingPoint(false);
  };
  
  // Handle edit place
  const handleEditPlace = (place: Place) => {
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

    return [
      [-100, -100], 
      [100, 100]    
    ];
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
              onClick={() => handleFloorChange(index)}
              style={index === activeFloorIndex ? { backgroundColor: organization?.primaryColor } : undefined}
            >
              {floor.name}
            </button>
          ))}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative"
        style={{ height: '500px', overflow: 'hidden' }}
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
          <FloorImageOverlay
            floorImage={activeFloor?.mapImage || ''}
            imageBounds={getImageBounds()}
          />
          
          <PlaceMarkers 
            places={activeFloorPlaces} 
            selectedPlaceId={selectedPlaceId}
            isAdmin={isAdmin}
            onPlaceClick={handlePlaceClick}
            onEditClick={handleEditPlace}
            imageBounds={getImageBounds()}
            accentColor={organization?.primaryColor}
          />
          
          {tempPoint && (
            <TempMarker
              position={tempPoint}
              onConfirm={handleTempMarkerConfirm}
              onCancel={handleTempMarkerCancel}
              imageBounds={getImageBounds()}
              accentColor={organization?.primaryColor}
            />
          )}
          
          <MapController
            onResize={handleMapResize}
          />

          <MapEvents 
            isPlacingPoint={isPlacingPoint} 
            onMapClick={handleMapClick} 
          />
        </MapContainer>
        
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-[1000]">
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
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-[1000]">
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
      </div>
      
      {/* Create place modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTempPoint(null);
          setTempPointPercentage(null);
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
                setTempPointPercentage(null);
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

export default FloorMapLeaflet;