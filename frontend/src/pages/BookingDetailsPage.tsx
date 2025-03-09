import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Tag, Clock, Calendar, ChevronLeft, ChevronRight, X, QrCode, Map } from 'lucide-react';
import { getBookingById, getSpaceById, getCoworkingById, cancelBooking, getFloors } from '../modules/cowork/api';
import { createVisitQrCodeData } from '../modules/cowork/api/visitApi';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import LeafletMap from '../modules/cowork/components/LeafletMap';
import FloorMapViewerLeaflet from '../modules/cowork/components/FloorMapViewerLeaflet';
import Modal from '../shared/components/Modal';
import { ROUTES } from '../config';
import { Floor } from '../modules/cowork/types';
import { QRCodeSVG } from 'qrcode.react';

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isFloorMapOpen, setIsFloorMapOpen] = useState(false);
  const [floors, setFloors] = useState<Floor[]>([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id!),
    enabled: !!id,
  });
  
  const { data: space, isLoading: isLoadingSpace } = useQuery({
    queryKey: ['space', booking?.spaceId],
    queryFn: () => getSpaceById(booking!.spaceId),
    enabled: !!booking?.spaceId,
  });

  const { data: coworking, isLoading: isLoadingCoworking } = useQuery({
    queryKey: ['coworking', space?.coworkingId],
    queryFn: () => getCoworkingById(space!.coworkingId),
    enabled: !!space?.coworkingId,
  });

  // Fetch floors data
  const { data: floorsData, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', space?.coworkingId],
    queryFn: () => getFloors(space!.coworkingId),
    enabled: !!space?.coworkingId,
  });

  // Update floors when data is loaded
  useEffect(() => {
    if (floorsData) {
      setFloors(floorsData);
    }
  }, [floorsData]);

  const isLoading = isLoadingBooking || isLoadingSpace || isLoadingCoworking || isLoadingFloors;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Check if booking is in the past
  const isBookingPast = () => {
    if (!booking) return false;
    const now = new Date();
    const endTime = new Date(booking.endTime);
    return endTime < now;
  };

  // Check if booking is active (current time is between start and end)
  const isBookingActive = () => {
    if (!booking) return false;
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    return now >= startTime && now <= endTime;
  };

  // Generate QR code data for the booking
  const getQrCodeData = () => {
    if (!booking || !space || !coworking) return '';
    
    // Extract the numeric IDs
    const buildingId = parseInt(coworking.id);
    const placeId = parseInt(space.id);
    const visitId = parseInt(booking.id);
    
    // Generate QR code data
    return createVisitQrCodeData(buildingId, placeId, visitId);
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!booking) return;
    
    try {
      await cancelBooking(booking.id);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Error canceling booking:', error);
    }
  };

  // Handle reschedule booking
  const handleRescheduleBooking = () => {
    if (!booking || !space) return;
    
    // Set flag to indicate we're rescheduling
    setIsRescheduling(true);
    
    // Store the current booking ID in session storage to reference it during the booking process
    sessionStorage.setItem('reschedulingBookingId', booking.id);
    
    // Navigate to the booking page for the same space
    navigate(`/booking/${space.id}?reschedule=true`);
  };

  // Find the floor and place for the selected space
  const findFloorWithSpace = () => {
    if (!floors || !space) return null;
    
    return floors.find(floor => 
      floor.places.some(place => place.id === space.id)
    );
  };

  // Modify the floor data to highlight the booked space and dim others
  const getModifiedFloor = () => {
    const floorWithSpace = findFloorWithSpace();
    if (!floorWithSpace) return null;
    
    return {
      ...floorWithSpace,
      places: floorWithSpace.places.map(place => ({
        ...place,
        // Make the booked space highlighted and others dimmed
        opacity: place.id === space?.id ? 1 : 0.3,
        disabled: place.id !== space?.id // Only allow clicking on the booked space
      }))
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking || !space || !coworking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Бронирование не найдено.</p>
        <button 
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  const modifiedFloor = getModifiedFloor();

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Назад
      </button>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Детали бронирования</h1>

          {/* Booking Details */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{space.name}</h2>
                <p className="text-lg text-gray-600 mt-1">{coworking.name}</p>
              </div>
              
              <div className="mt-4 md:mt-0 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700 mb-1">
                  <Calendar size={20} className="mr-2 text-primary" style={{ color: organization?.primaryColor }} />
                  <span className="font-medium text-primary" style={{ color: organization?.primaryColor }}>{formatDate(booking.startTime)}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock size={20} className="mr-2 text-primary" style={{ color: organization?.primaryColor }} />
                  <span className="text-xl font-bold">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floor Map Button */}
          {modifiedFloor && (
            <div className="mb-8">
              <button
                onClick={() => setIsFloorMapOpen(true)}
                className="btn-primary flex items-center justify-center w-full py-3"
                style={{ backgroundColor: organization?.primaryColor }}
              >
                <Map size={20} className="mr-2" />
                Показать план этажа
              </button>
            </div>
          )}

          {/* QR Code Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold mb-2">QR-код бронирования</h3>
                <p className="text-gray-600">Покажите этот QR-код администратору при входе в коворкинг.</p>
              </div>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="btn-primary flex items-center"
                style={{ backgroundColor: organization?.primaryColor }}
              >
                <QrCode size={20} className="mr-2" />
                Показать QR-код
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Расположение</h2>
            <div className="flex items-start text-gray-700 mb-4">
              <MapPin size={20} className="mr-2 mt-1 flex-shrink-0 text-primary" style={{ color: organization?.primaryColor }} />
              <span className="text-lg">{coworking.address}</span>
            </div>
            
            <div className="h-64 rounded-lg overflow-hidden">
              <LeafletMap 
                coworkings={[coworking]} 
                selectedCoworking={coworking}
                height="100%"
                interactive={false}
              />
            </div>
          </div>

          {/* Space Photos - only show if available */}
          {space.photo && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Фотографии места</h2>
              <div className="rounded-xl overflow-hidden h-48 md:h-64">
                <img 
                  src={space.photo} 
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isBookingPast() && (
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleRescheduleBooking}
                className="btn-primary flex-1 py-3 text-lg"
                style={{ backgroundColor: organization?.primaryColor }}
                disabled={isRescheduling}
              >
                {isRescheduling ? 'Подготовка...' : 'Перенести'}
              </button>
              <button 
                onClick={() => setIsConfirmCancelOpen(true)}
                className="btn-danger flex-1 py-3 text-lg"
              >
                Отменить бронирование
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floor Map Modal */}
      <Modal
        isOpen={isFloorMapOpen}
        onClose={() => setIsFloorMapOpen(false)}
        title="План этажа"
        maxWidth="max-w-4xl"
        noPadding={true}
      >
        <div className="h-[70vh]">
          {modifiedFloor && (
            <FloorMapViewerLeaflet 
              floors={[modifiedFloor]} 
              coworkingId={coworking.id}
            />
          )}
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="QR-код бронирования"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCodeSVG 
              value={getQrCodeData()}
              size={256}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <p className="text-gray-600 mb-4">
            Покажите этот QR-код администратору при входе в коворкинг.
            Он отсканирует его для подтверждения вашего бронирования.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
            <p className="font-medium">Детали бронирования:</p>
            <p>Место: {space.name}</p>
            <p>Дата: {formatDate(booking.startTime)}</p>
            <p>Время: {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
          </div>
          <button 
            onClick={() => setIsQrModalOpen(false)}
            className="btn-primary w-full"
            style={{ backgroundColor: organization?.primaryColor }}
          >
            Закрыть
          </button>
        </div>
      </Modal>

      {/* Confirm Cancel Modal */}
      <Modal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        title="Отменить бронирование"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы уверены, что хотите отменить это бронирование? Это действие нельзя отменить.
          </p>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              className="btn-secondary"
              onClick={() => setIsConfirmCancelOpen(false)}
            >
              Нет, сохранить бронирование
            </button>
            <button
              className="btn-danger"
              onClick={handleCancelBooking}
            >
              Да, отменить бронирование
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetailsPage;