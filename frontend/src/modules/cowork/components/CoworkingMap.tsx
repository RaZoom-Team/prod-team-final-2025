import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import { Coworking } from '../types';
import { ROUTES } from '../../../config';
import LeafletMap from './LeafletMap';
import { getOrganization } from '../../../modules/admin/api/organizationApi';
import { useQuery } from '@tanstack/react-query';

interface CoworkingMapProps {
  coworkings: Coworking[];
  height?: string;
  onCoworkingSelect?: (coworking: Coworking) => void;
  selectedCoworking?: Coworking | null;
}

const CoworkingMap: React.FC<CoworkingMapProps> = ({ 
  coworkings, 
  height = '500px',
  onCoworkingSelect,
  selectedCoworking: externalSelectedCoworking = null
}) => {
  const [internalSelectedCoworking, setInternalSelectedCoworking] = useState<Coworking | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Check if device is mobile on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use either external or internal selected coworking
  const selectedCoworking = externalSelectedCoworking || internalSelectedCoworking;

  const handleCoworkingSelect = (coworking: Coworking) => {
    setInternalSelectedCoworking(coworking);
    if (onCoworkingSelect) {
      onCoworkingSelect(coworking);
    }
  };

  const handleViewDetails = () => {
    if (selectedCoworking) {
      // Navigate directly to the floor plan view
      navigate(ROUTES.COWORKING_FLOORS.replace(':id', selectedCoworking.id));
    }
  };

  const handleMyLocation = () => {
    // Dispatch a custom event that will be caught by the map component
    window.dispatchEvent(new Event('requestLocation'));
  };

  // Format time for display
  const formatTime = (hour: number | null): string => {
    if (hour === null) return 'Not set';
    return `${String(hour).padStart(2, '0')}:00`;
  };

  // Check if coworking has working hours
  const hasWorkingHours = (coworking: Coworking): boolean => {
    return coworking.open_from !== null && coworking.open_till !== null;
  };

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden h-full">
      <LeafletMap 
        coworkings={coworkings}
        onCoworkingSelect={handleCoworkingSelect}
        selectedCoworking={selectedCoworking}
        height={height}
        sidebarPosition={isMobile ? 'bottom' : 'left'}
      />
      
      {/* My Location button (desktop only) */}
      <div className="absolute bottom-4 right-4 z-10 hidden md:block">
        <button
          onClick={handleMyLocation}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Моё местоположение"
        >
          <Navigation size={20} className="text-primary" style={{ color: organization?.primaryColor }} />
        </button>
      </div>
      
      {/* Desktop sidebar for selected coworking */}
      {selectedCoworking && !isMobile && (
        <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-lg z-10 overflow-y-auto">
          <div className="p-4">
            {selectedCoworking.photos && selectedCoworking.photos.length > 0 && (
              <img 
                src={selectedCoworking.photos[0]} 
                alt={selectedCoworking.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
            )}
            
            <h3 className="font-semibold text-gray-800 text-lg mb-2">{selectedCoworking.name}</h3>
            
            <div className="flex items-center mt-1 text-gray-600 text-sm mb-2">
              <MapPin size={16} className="mr-1 flex-shrink-0" />
              <span className="truncate">{selectedCoworking.address}</span>
            </div>
            
            {/* Working hours */}
            <div className="text-gray-600 text-sm mb-3">
              {hasWorkingHours(selectedCoworking) ? (
                <span>
                  Часы работы: {formatTime(selectedCoworking.open_from)} - {formatTime(selectedCoworking.open_till)}
                </span>
              ) : (
                <span>Открыто 24/7</span>
              )}
            </div>
            
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">
              {selectedCoworking.description}
            </p>
            
            {selectedCoworking.photos.length > 1 && (
              <div className="mb-4">
                <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                  {selectedCoworking.photos.slice(0, 5).map((photo, index) => (
                    <div key={index} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`${selectedCoworking.name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              className="w-full btn-primary py-2"
              onClick={handleViewDetails}
              style={{ backgroundColor: organization?.primaryColor }}
            >
              Продолжить
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default CoworkingMap;