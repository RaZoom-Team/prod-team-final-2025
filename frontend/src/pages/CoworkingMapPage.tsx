import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, ArrowLeft, Clock } from 'lucide-react';
import { getCoworkings } from '../modules/cowork/api';
import CoworkingMap from '../modules/cowork/components/CoworkingMap';
import BottomSheet from '../shared/components/BottomSheet';
import { ROUTES } from '../config';
import { Coworking } from '../modules/cowork/types';
import { getOrganization } from '../modules/admin/api/organizationApi';

const CoworkingMapPage: React.FC = () => {
  const [selectedCoworking, setSelectedCoworking] = useState<Coworking | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      const headerHeight = 60;
      setFullHeight(windowHeight - headerHeight);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  const { data: coworkings = [], isLoading } = useQuery({
    queryKey: ['coworkings'],
    queryFn: getCoworkings,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCoworkingSelect = (coworking: Coworking) => {
    setSelectedCoworking(coworking);
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
  };

  const handleViewDetails = () => {
    if (selectedCoworking) {
      navigate(ROUTES.COWORKING_FLOORS.replace(':id', selectedCoworking.id));
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location found:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
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
    <div className="fixed inset-0 z-10 flex flex-col">
      {/* Beautiful header with centered back button in Russian */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white shadow-md">
        <div className="relative h-14 flex items-center justify-center">
          {/* Back button on the left */}
          <button
            className="absolute left-4 flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => navigate(-1)}
            aria-label="Назад"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          
          {/* Centered title */}
          <h2 className="text-xl font-bold text-gray-800">
            Выберите коворкинг
          </h2>
        </div>
      </div>

      {/* My Location button */}
      <div className="absolute bottom-4 right-4 z-20">
        <button
          className="flex items-center justify-center p-3 rounded-full bg-white shadow-md"
          onClick={handleMyLocation}
          aria-label="Моё местоположение"
        >
          <Navigation size={20} className="text-primary" style={{ color: organization?.primaryColor }} />
        </button>
      </div>

      {/* Map */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div 
          className="flex-1 mt-14" 
          ref={mapContainerRef}
          style={{ height: `${fullHeight}px` }}
        >
          <CoworkingMap 
            coworkings={coworkings} 
            height="100%" 
            onCoworkingSelect={handleCoworkingSelect}
            selectedCoworking={selectedCoworking}
          />
        </div>
      )}

      {/* Bottom Sheet for mobile */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        showHandle={true}
        transparent={true}
      >
        {selectedCoworking && (
          <div className="px-4 pb-4">
            {/* Name */}
            <h3 className="text-lg font-semibold mb-1">{selectedCoworking.name}</h3>
            
            {/* Address */}
            <p className="text-gray-600 text-sm flex items-center mb-2">
              <MapPin size={14} className="mr-1 flex-shrink-0" />
              {selectedCoworking.address}
            </p>
            
            {/* Working hours */}
            <p className="text-gray-600 text-sm flex items-center mb-2">
              <Clock size={14} className="mr-1 flex-shrink-0" />
              {selectedCoworking.open_from && selectedCoworking.open_till ? (
                <span>
                  {formatTime(selectedCoworking.open_from)} - {formatTime(selectedCoworking.open_till)}
                </span>
              ) : (
                <span>Круглосуточно</span>
              )}
            </p>
            
            {/* Description */}
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {selectedCoworking.description}
            </p>
            
            {/* Photos */}
            {selectedCoworking.photos.length > 0 && (
              <div className="mb-3">
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
        )}
      </BottomSheet>
    </div>
  );
};

export default CoworkingMapPage;