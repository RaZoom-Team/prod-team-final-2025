import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, PlusCircle, QrCode } from 'lucide-react';
import { getBookings, getSpaceById, getCoworkingById } from '../modules/cowork/api';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { createVisitQrCodeData } from '../modules/cowork/api/visitApi';
import { ROUTES } from '../config';
import Modal from '../shared/components/Modal';
import { QRCodeSVG } from 'qrcode.react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => getBookings(user?.id),
    enabled: !!user?.id,
  });

  // Get space details for each booking
  const bookingsWithDetails = useQuery({
    queryKey: ['bookingsWithDetails', bookings],
    queryFn: async () => {
      const detailedBookings = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const space = await getSpaceById(booking.spaceId);
            const coworking = await getCoworkingById(space.coworkingId);
            return { ...booking, space, coworking };
          } catch (error) {
            console.error('Error fetching details for booking:', error);
            return booking;
          }
        })
      );
      return detailedBookings;
    },
    enabled: bookings.length > 0,
  });

  // Filter bookings by date
  const now = new Date();
  const upcomingBookings = bookingsWithDetails.data?.filter(booking => 
    new Date(booking.endTime) >= now
  ) || [];
  
  // Get the nearest upcoming booking
  const nearestBooking = upcomingBookings.length > 0 ? 
    upcomingBookings.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )[0] : null;

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

  const handleBookingClick = (bookingId: string) => {
    navigate(ROUTES.BOOKING_DETAILS.replace(':id', bookingId));
  };

  const handleNewBooking = () => {
    navigate(ROUTES.COWORKING_MAP);
  };

  const isLoading = isLoadingBookings || bookingsWithDetails.isLoading;

  // Generate QR code data for a booking
  const generateQrCodeData = (booking: any) => {
    if (!booking || !booking.space || !booking.coworking) return '';
    
    // Extract the numeric IDs
    const buildingId = parseInt(booking.coworking.id);
    const placeId = parseInt(booking.space.id);
    const visitId = parseInt(booking.id);
    
    // Generate QR code data
    return createVisitQrCodeData(buildingId, placeId, visitId);
  };

  // Open QR code modal for a specific booking
  const openQrCodeModal = (booking: any) => {
    setSelectedBooking(booking);
    setIsQrModalOpen(true);
  };

  // Get first photo from coworking
  const getFirstCoworkingPhoto = (coworking: any) => {
    if (!coworking || !coworking.photos || coworking.photos.length === 0) {
      return 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
    }
    return coworking.photos[0];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Мои брони</h1>
      
      {/* Nearest Booking Widget */}
      {nearestBooking && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Ближайшая бронь</h2>
          
          <div 
            className="flex flex-col md:flex-row relative cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
            onClick={() => handleBookingClick(nearestBooking.id)}
            style={{ borderColor: organization?.primaryColor }}
          >
            {'space' in nearestBooking && 'coworking' in nearestBooking ? (
              <>
                {/* Desktop layout with image */}
                <div className="hidden md:block md:w-1/3 md:mr-4">
                  <img 
                    src={nearestBooking.space.photo || getFirstCoworkingPhoto(nearestBooking.coworking)} 
                    alt={nearestBooking.space.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                
                {/* Content area - different for mobile and desktop */}
                <div className="flex-1 pr-28 md:pr-36">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1">
                    {nearestBooking.space.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{nearestBooking.coworking.name}</p>
                  
                  <div className="flex items-center font-semibold mb-1" style={{ color: organization?.primaryColor }}>
                    <Calendar size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-sm md:text-base">{formatDate(nearestBooking.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center font-semibold" style={{ color: organization?.primaryColor }}>
                    <Clock size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-sm md:text-base">{formatTime(nearestBooking.startTime)} – {formatTime(nearestBooking.endTime)}</span>
                  </div>
                  
                  <div className="hidden md:flex items-start text-sm text-gray-600 mt-2">
                    <MapPin size={16} className="mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{nearestBooking.coworking.address}</span>
                  </div>
                </div>
                
                {/* QR Code button positioned on the right side, taking full height */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openQrCodeModal(nearestBooking);
                  }}
                  className="absolute right-0 top-0 bottom-0 w-24 md:w-32 flex flex-col items-center justify-center h-full text-primary hover:text-primary/80 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-r-lg transition-colors"
                  aria-label="Показать QR-код"
                  style={{ color: organization?.primaryColor }}
                >
                  <QrCode size={48} className="mb-1 md:mb-2" strokeWidth={1.5} />
                  <span className="text-xs text-center px-1">Нажмите, чтобы открыть QR</span>
                </div>
              </>
            ) : (
              <div className="p-4 pr-28 md:pr-36 relative">
                <h3 className="text-lg font-bold text-gray-800">Space #{nearestBooking.spaceId}</h3>
                <div className="mt-3 mb-2">
                  <div className="flex items-center text-base font-semibold" style={{ color: organization?.primaryColor }}>
                    <Clock size={16} className="mr-2 flex-shrink-0" />
                    <span className="text-sm md:text-base">{formatTime(nearestBooking.startTime)} – {formatTime(nearestBooking.endTime)}</span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: organization?.primaryColor }}>
                    {formatDate(nearestBooking.startTime)}
                  </div>
                </div>
                
                {/* QR Code button positioned on the right side, taking full height */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    openQrCodeModal(nearestBooking);
                  }}
                  className="absolute right-0 top-0 bottom-0 w-24 md:w-32 flex flex-col items-center justify-center h-full text-primary hover:text-primary/80 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-r-lg transition-colors"
                  aria-label="Показать QR-код"
                  style={{ color: organization?.primaryColor }}
                >
                  <QrCode size={48} className="mb-1 md:mb-2" strokeWidth={1.5} />
                  <span className="text-xs text-center px-1">Нажмите, чтобы открыть QR</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Все брони</h2>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleBookingClick(booking.id)}
                    >
                      {'space' in booking && 'coworking' in booking ? (
                        <div className="p-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{booking.space.name}</h3>
                            <p className="text-xs text-gray-600 truncate">{booking.coworking.name}</p>
                            <div className="flex items-center mt-1 text-xs" style={{ color: organization?.primaryColor }}>
                              <Calendar size={12} className="mr-1 flex-shrink-0" />
                              <span>{formatDate(booking.startTime)}</span>
                              <Clock size={12} className="ml-2 mr-1 flex-shrink-0" />
                              <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-800">Space #{booking.spaceId}</h3>
                          <div className="flex items-center mt-1 text-xs" style={{ color: organization?.primaryColor }}>
                            <Calendar size={12} className="mr-1 flex-shrink-0" />
                            <span>{formatDate(booking.startTime)}</span>
                            <Clock size={12} className="ml-2 mr-1 flex-shrink-0" />
                            <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                      <Calendar size={24} className="text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Нет броней</h3>
                  <p className="text-gray-500 mb-4">У вас пока нет забронированных мест.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add New Booking Button - Mobile */}
      <div className="fixed bottom-20 right-4 md:hidden z-10">
        <button 
          onClick={handleNewBooking}
          className="btn-primary flex items-center justify-center rounded-full w-14 h-14 shadow-lg"
          aria-label="Добавить бронь"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          <PlusCircle size={24} />
        </button>
      </div>

      {/* Add New Booking Button - Desktop */}
      <div className="hidden md:block">
        <button 
          onClick={handleNewBooking}
          className="btn-primary flex items-center justify-center py-3 px-6 text-lg"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          <PlusCircle size={20} className="mr-2" />
          Добавить бронь
        </button>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Ваш QR-код для брони"
        maxWidth="max-w-sm"
      >
        {selectedBooking && (
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <QRCodeSVG 
                value={generateQrCodeData(selectedBooking)}
                size={256}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
              <p className="font-medium">Детали брони:</p>
              {'space' in selectedBooking && (
                <p>Место: {selectedBooking.space.name}</p>
              )}
              {'coworking' in selectedBooking && (
                <p>Коворкинг: {selectedBooking.coworking.name}</p>
              )}
              <p>Дата: {formatDate(selectedBooking.startTime)}</p>
              <p>Время: {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p>
            </div>
            <p className="text-gray-600 mb-4">
              Покажите этот QR-код администратору при входе в коворкинг для подтверждения вашей брони.
            </p>
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="btn-primary w-full"
              style={{ backgroundColor: organization?.primaryColor }}
            >
              Закрыть
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;