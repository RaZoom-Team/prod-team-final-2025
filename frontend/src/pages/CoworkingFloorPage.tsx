import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, Maximize } from 'lucide-react';
import { getCoworkingById, getFloors, checkPlaceAvailability } from '../modules/cowork/api';
import { getOrganization } from '../modules/admin/api/organizationApi';
import FloorMapViewerLeaflet from '../modules/cowork/components/FloorMapViewerLeaflet';
import TimePicker from '../modules/cowork/components/TimePicker';
import Modal from '../shared/components/Modal';
import { ROUTES } from '../config';
import { Floor } from '../modules/cowork/types';

const CoworkingFloorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fullHeight, setFullHeight] = useState(0);
  const [startTime, setStartTime] = useState(9); // Default to 9 AM
  const [endTime, setEndTime] = useState(17); // Default to 5 PM
  const [filteredFloors, setFilteredFloors] = useState<Floor[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Calculate full height for the map
  useEffect(() => {
    const calculateHeight = () => {
      const windowHeight = window.innerHeight;
      // Subtract header height only
      const headerHeight = 60;
      setFullHeight(windowHeight - headerHeight);
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Get coworking data
  const { data: coworking, isLoading: isLoadingCoworking } = useQuery({
    queryKey: ['coworking', id],
    queryFn: () => getCoworkingById(id!),
    enabled: !!id,
  });

  // Get floors data separately
  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', id],
    queryFn: () => getFloors(id!),
    enabled: !!id,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Filter places based on time and date
  useEffect(() => {
    if (!floors || floors.length === 0) return;
    
    const filterPlaces = async () => {
      setIsCheckingAvailability(true);
      
      try {
        // Create date objects for the selected time range
        const startDate = new Date(selectedDate);
        startDate.setHours(startTime, 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(endTime, 0, 0, 0);
        
        // Create a deep copy of floors to modify
        const newFilteredFloors = await Promise.all(
          floors.map(async (floor) => {
            // Process each place in the floor
            const filteredPlaces = await Promise.all(
              floor.places.map(async (place) => {
                // Check if the place is available for the selected time
                try {
                  const isAvailable = await checkPlaceAvailability(
                    parseInt(id!),
                    parseInt(place.id),
                    startDate.toISOString(),
                    endDate.toISOString()
                  );
                  
                  // Return modified place with availability status
                  return {
                    ...place,
                    status: isAvailable ? 'available' : 'occupied',
                    opacity: isAvailable ? 1 : 0.4, // Dim unavailable places
                    disabled: !isAvailable // Make unavailable places non-clickable
                  };
                } catch (error) {
                  console.error(`Error checking availability for place ${place.id}:`, error);
                  return place; // Return original place if check fails
                }
              })
            );
            
            // Return the floor with filtered places
            return {
              ...floor,
              places: filteredPlaces
            };
          })
        );
        
        setFilteredFloors(newFilteredFloors);
      } catch (error) {
        console.error('Error filtering places:', error);
      } finally {
        setIsCheckingAvailability(false);
      }
    };
    
    filterPlaces();
  }, [floors, startTime, endTime, id, selectedDate]);

  // Handle time changes
  const handleStartTimeChange = (value: number) => {
    setStartTime(value);
    if (value >= endTime) {
      setEndTime(value + 1 > 23 ? 23 : value + 1);
    }
  };

  const handleEndTimeChange = (value: number) => {
    setEndTime(value);
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  // Get min date (today)
  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date (3 months from now)
  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Apply filters and close modal
  const applyFilters = () => {
    setIsFilterModalOpen(false);
  };

  const isLoading = isLoadingCoworking || isLoadingFloors || isCheckingAvailability;

  if (isLoading && !filteredFloors.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!floors || floors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Планы этажей для этого коворкинга недоступны.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Назад
        </button>
      </div>
    );
  }

  const displayFloors = filteredFloors.length > 0 ? filteredFloors : floors;

  return (
    <div className="fixed inset-0 z-10 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm z-20">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <button
            className="flex items-center justify-center mr-4"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold">Выберите место</h1>
          
          {/* Show current filter info */}
          <div className="ml-auto flex items-center text-sm text-gray-600">
            <span className="hidden md:inline">{formatDate(selectedDate)}, </span>
            <span>{startTime}:00 - {endTime}:00</span>
            {isCheckingAvailability && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            )}
          </div>
        </div>
      </div>

      {/* Floor Map */}
      <div 
        className="flex-1 relative" 
        style={{ height: `${fullHeight}px` }}
      >
        <FloorMapViewerLeaflet 
          floors={displayFloors} 
          coworkingId={id!}
        />
        
        {/* Filter and Reset buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="p-3 rounded-full shadow-md bg-white text-gray-700 hover:bg-gray-100"
            aria-label="Фильтр"
          >
            <Filter size={20} style={{ color: organization?.primaryColor }} />
          </button>
          
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([0, 0], 0);
                mapRef.current.fitBounds(getImageBounds());
              }
            }}
            className="p-3 rounded-full shadow-md bg-white text-gray-700 hover:bg-gray-100"
            aria-label="Сбросить вид"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Фильтр по времени и дате"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 p-2">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата
            </label>
            <input
              type="date"
              className="input w-full"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              min={getMinDate()}
              max={getMaxDate()}
            />
          </div>
          
          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            <TimePicker 
              value={startTime}
              onChange={handleStartTimeChange}
              label="Время начала"
              minTime={9}
              maxTime={22}
            />
            <TimePicker 
              value={endTime}
              onChange={handleEndTimeChange}
              label="Время окончания"
              minTime={startTime + 1}
              maxTime={23}
            />
          </div>
          
          {isCheckingAvailability && (
            <div className="flex items-center justify-center text-sm text-gray-600 py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-2"></div>
              Проверка доступности...
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <button
              onClick={applyFilters}
              className="btn-primary"
              style={{ backgroundColor: organization?.primaryColor }}
            >
              Применить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoworkingFloorPage;