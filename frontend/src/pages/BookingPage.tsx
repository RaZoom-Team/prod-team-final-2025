import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getSpaceById, getCoworkingById, createBooking, cancelBooking, checkPlaceAvailability } from '../modules/cowork/api';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import TimePicker from '../modules/cowork/components/TimePicker';
import { ROUTES } from '../config';
import BottomSheet from '../shared/components/BottomSheet';
import Modal from '../shared/components/Modal';
import FloorMapViewerLeaflet from '../modules/cowork/components/FloorMapViewerLeaflet';
import ICalendarLink from "react-icalendar-link"

const BookingPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Check if this is a reschedule operation
  const searchParams = new URLSearchParams(location.search);
  const isRescheduling = searchParams.get('reschedule') === 'true';
  const reschedulingBookingId = sessionStorage.getItem('reschedulingBookingId');
  
  const [startTime, setStartTime] = useState(9); // Default to 9 AM
  const [endTime, setEndTime] = useState(17); // Default to 5 PM
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end'>('start');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: space, isLoading: isLoadingSpace } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => getSpaceById(spaceId!),
    enabled: !!spaceId,
  });

  const { data: coworking, isLoading: isLoadingCoworking } = useQuery({
    queryKey: ['coworking', space?.coworkingId],
    queryFn: () => getCoworkingById(space!.coworkingId),
    enabled: !!space?.coworkingId,
  });

  // Find the floor and place for the selected space
  const floorWithSpace = coworking?.floors?.find(floor => 
    floor.places.some(place => place.id === spaceId)
  );
  
  // Modify the floor data to highlight the booked space and dim others
  const modifiedFloor = floorWithSpace ? {
    ...floorWithSpace,
    places: floorWithSpace.places.map(place => ({
      ...place,
      // Make the booked space highlighted and others dimmed
      opacity: place.id === spaceId ? 1 : 0.3,
      disabled: place.id !== spaceId // Only allow clicking on the booked space
    }))
  } : null;

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setBookingComplete(true);
      setBookingError(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      // Clear the rescheduling booking ID from session storage
      if (isRescheduling) {
        sessionStorage.removeItem('reschedulingBookingId');
      }
    },
    onError: (error: Error) => {
      setBookingComplete(false);
      setBookingError(error.message || 'Произошла ошибка при бронировании');
      setIsProcessing(false);
    }
  });
  
  // Cancel booking mutation for rescheduling
  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      // After cancellation, proceed with creating the new booking
      createNewBooking();
    },
    onError: (error: Error) => {
      // Even if there's an error canceling the previous booking, still try to create the new one
      console.warn('Failed to cancel previous booking, but will still try to create new one:', error);
      createNewBooking();
    }
  });

  const isLoading = isLoadingSpace || isLoadingCoworking;

  // Set minimum time to current hour if booking for today
  const now = new Date();
  const currentHour = now.getHours();
  const isToday = bookingDate.toDateString() === now.toDateString();
  const minStartTime = isToday ? currentHour + 1 : 9; // Next hour from now if today, otherwise 9 AM

  // Initialize start time to next available hour if current time is past default start time
  useEffect(() => {
    if (isToday && minStartTime > startTime) {
      setStartTime(minStartTime);
      // Ensure end time is at least 1 hour after start time
      if (minStartTime >= endTime) {
        setEndTime(minStartTime + 1 > 23 ? 23 : minStartTime + 1);
      }
    }
  }, [bookingDate]);

  // Check availability when time or date changes
  useEffect(() => {
    if (space && coworking) {
      checkAvailability();
    }
  }, [startTime, endTime, bookingDate, space, coworking]);

  const checkAvailability = async () => {
    if (!space || !coworking) return;
    
    setIsCheckingAvailability(true);
    setIsAvailable(null);
    
    try {
      // Create booking date for the selected date
      const startDate = new Date(bookingDate);
      startDate.setHours(startTime, 0, 0, 0);
      
      // Set end time
      const endDate = new Date(bookingDate);
      endDate.setHours(endTime, 0, 0, 0);
      
      const available = await checkPlaceAvailability(
        parseInt(coworking.id),
        parseInt(space.id),
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const generateICalEvent = () => {
    if (!space || !coworking || !bookingDate || !startTime || !endTime) return null;

    const startDate = new Date(bookingDate);
    startDate.setHours(startTime, 0, 0, 0);

    const endDate = new Date(bookingDate);
    endDate.setHours(endTime, 0, 0, 0);

    const event = {
        title: `Бронирование места ${space.name} в ${coworking.name}`,
        description: `Бронирование места ${space.name} в коворкинге ${coworking.name} на ${formatDate(bookingDate)} с ${startTime}:00 до ${endTime}:00.`,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: coworking.address, 
    };
    return event;
};

  const handleStartTimeChange = (value: number) => {
    setStartTime(value);
    if (value >= endTime) {
      setEndTime(value + 1 > 23 ? 23 : value + 1);
    }
  };

  const handleEndTimeChange = (value: number) => {
    setEndTime(value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);

    // Check if the date is valid
    if (isNaN(newDate.getTime())) {
      return;
    }

    setBookingDate(newDate);
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

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Create a new booking
  const createNewBooking = () => {
    if (!user || !space) return;

    // Create booking date for the selected date
    const startDate = new Date(bookingDate);
    startDate.setHours(startTime, 0, 0, 0);
    
    // Set end time
    const endDate = new Date(bookingDate);
    endDate.setHours(endTime, 0, 0, 0);

    bookingMutation.mutate({
      spaceId: space.id,
      userId: user.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: 'confirmed',
    });
  };

  const downloadICal = () => {
    const iCalContent = generateICalContent();

    if (!iCalContent) {
      console.warn("Невозможно сгенерировать iCal контент");
      return;
    }

    // This part is crucial for triggering the calendar event import on the client's device

    const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Attempt to open the iCalendar file directly with the default calendar application.
    window.location.href = url;

    // Clean up by revoking the URL object
    URL.revokeObjectURL(url);
  };

const generateICalContent = () => {
  if (!space || !coworking || !bookingDate || !startTime || !endTime) return null;

  const startDate = new Date(bookingDate);
  startDate.setHours(startTime, 0, 0, 0);

  const endDate = new Date(bookingDate);
  endDate.setHours(endTime, 0, 0, 0);

  const formatUTC = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const startUTC = formatUTC(startDate);
  const endUTC = formatUTC(endDate);
  const nowUTC = formatUTC(new Date());

  const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const iCalendarContent = `BEGIN:VCALENDAR
      VERSION:2.0
      CALSCALE:GREGORIAN
      BEGIN:VEVENT
      UID:${uid}
      DTSTAMP:${nowUTC}
      DTSTART:${startUTC}
      DTEND:${endUTC}
      SUMMARY:Бронирование места ${space.name} в ${coworking.name}
      LOCATION:${coworking.address}
      DESCRIPTION:Бронирование места ${space.name} в коворкинге ${coworking.name} на ${formatDate(bookingDate)} с ${startTime}:00 до ${endTime}:00.
      END:VEVENT
      END:VCALENDAR`;

  return iCalendarContent;
};

  // Handle booking with rescheduling logic
  const handleBooking = () => {
    if (!user || !space) return;

    // Validate that start time is not in the past
    const startDate = new Date(bookingDate);
    startDate.setHours(startTime, 0, 0, 0);
    
    if (startDate < now) {
      setBookingError('Невозможно забронировать на прошедшее время');
      return;
    }

    // Check if the space is available
    if (isAvailable === false) {
      setBookingError('Это место уже забронировано на выбранное время');
      return;
    }
    
    setIsProcessing(true);
    setBookingError(null);

    // If this is a reschedule operation, cancel the old booking first
    if (isRescheduling && reschedulingBookingId) {
      cancelBookingMutation.mutate(reschedulingBookingId);
    } else {
      // Otherwise, just create a new booking
      createNewBooking();
    }
  };

  const openTimePicker = (type: 'start' | 'end') => {
    setActiveTimePicker(type);
    setIsTimePickerOpen(true);
  };

  const handleTimePickerChange = (value: number) => {
    if (activeTimePicker === 'start') {
      handleStartTimeChange(value);
    } else {
      handleEndTimeChange(value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!space || !coworking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Рабочее место не найдено.</p>
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Пожалуйста, войдите в систему, чтобы забронировать место.</p>
        <button 
          onClick={() => navigate(ROUTES.LOGIN)}
          className="mt-4 btn-primary"
        >
          Войти
        </button>
      </div>
    );
  }

  if (bookingComplete) {
    const iCalEvent = generateICalEvent();
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">
          {isRescheduling ? 'Бронирование перенесено!' : 'Бронирование подтверждено!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isRescheduling 
            ? `Вы успешно перенесли бронирование места ${space.name} в коворкинге ${coworking.name} на ${formatDate(bookingDate)} с ${startTime}:00 до ${endTime}:00.`
            : `Вы успешно забронировали место ${space.name} в коворкинге ${coworking.name} на ${formatDate(bookingDate)} с ${startTime}:00 до ${endTime}:00.`
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(ROUTES.HOME)}
            className="btn-primary"
            style={{ backgroundColor: organization?.primaryColor }}
          >
            На главную
          </button>
          {iCalEvent && (
                    <ICalendarLink event={iCalEvent} className="btn-primary" style={{ backgroundColor: organization?.primaryColor }}>
                        Добавить в календарь
                    </ICalendarLink>
                )}
        </div>
      </div>
    );
  }

  if (bookingError) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={32} className="text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Ошибка бронирования</h1>
        <p className="text-gray-600 mb-2">
          Не удалось завершить бронирование.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {bookingError}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => {
              setBookingError(null);
              navigate(-1);
            }}
            className="btn-secondary"
          >
            Назад
          </button>
          <button 
            onClick={() => setBookingError(null)}
            className="btn-primary"
            style={{ backgroundColor: organization?.primaryColor }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Назад
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">
            {isRescheduling ? 'Перенос бронирования' : 'Бронирование места'}
          </h1>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            {space.photo && <img 
              src={space.photo} 
              alt={space.name}
              className="h-16 w-16 rounded-lg object-cover mr-4"
            />}
            <div>
              <h2 className="text-lg font-semibold">{space.name}</h2>
              <p className="text-gray-600">{coworking.name}</p>
            </div>
          </div>

          {/* Floor Plan Section */}
          {modifiedFloor && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Расположение места</h2>
              <div className="h-64 md:h-96 rounded-lg overflow-hidden">
                <FloorMapViewerLeaflet 
                  floors={[modifiedFloor]} 
                  coworkingId={coworking.id}
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center text-gray-700 mb-2">
              <Calendar size={20} className="mr-2" />
              <span>Выберите дату и время бронирования</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              {/* Date picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4"
                  value={bookingDate.toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>
              
              {/* Mobile-friendly time selection */}
              <div className="md:hidden">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время начала
                  </label>
                  <button
                    onClick={() => openTimePicker('start')}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex justify-between items-center"
                  >
                    <span>{startTime}:00</span>
                    <Clock size={18} className="text-gray-500" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время окончания
                  </label>
                  <button
                    onClick={() => openTimePicker('end')}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex justify-between items-center"
                  >
                    <span>{endTime}:00</span>
                    <Clock size={18} className="text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Desktop time selection */}
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <TimePicker 
                    value={startTime}
                    onChange={handleStartTimeChange}
                    label="Время начала"
                    minTime={minStartTime}
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
              </div>

              <div className="mt-4 p-3 rounded-md text-sm">
                {isCheckingAvailability ? (
                  <div className="flex items-center text-blue-700 bg-blue-50">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-700 mr-2"></div>
                    Проверка доступности...
                  </div>
                ) : isAvailable === false ? (
                  <div className="flex items-center text-red-700 bg-red-50">
                    Это место уже забронировано на выбранное время. Пожалуйста, выберите другое время или дату.
                  </div>
                ) : isAvailable === true ? (
                  <div className="flex items-center text-green-700 bg-green-50">
                    Место доступно для бронирования на {formatDate(bookingDate)} с {startTime}:00 до {endTime}:00 ({endTime - startTime} час{endTime - startTime !== 1 ? 'ов' : ''}).
                  </div>
                ) : (
                  <div className="text-blue-700 bg-blue-50">
                    Ваше бронирование будет на {formatDate(bookingDate)} с {startTime}:00 до {endTime}:00 ({endTime - startTime} час{endTime - startTime !== 1 ? 'ов' : ''}).
                  </div>
                )}
              </div>
              
              {isRescheduling && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                  Вы переносите существующее бронирование. Ваше предыдущее бронирование будет отменено при подтверждении нового времени.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleBooking}
              className="btn-primary"
              disabled={isProcessing || isAvailable === false}
              style={{ 
                backgroundColor: isAvailable === false ? '#ccc' : organization?.primaryColor,
                cursor: isAvailable === false ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? 'Обработка...' : isRescheduling ? 'Подтвердить перенос' : 'Подтвердить бронирование'}
            </button>
          </div>
        </div>
      </div>

      <BottomSheet
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        title={`Выберите ${activeTimePicker === 'start' ? 'время начала' : 'время окончания'}`}
      >
        <div className="py-4">
          <TimePicker 
            value={activeTimePicker === 'start' ? startTime : endTime}
            onChange={handleTimePickerChange}
            label=""
            minTime={activeTimePicker === 'start' ? minStartTime : startTime + 1}
            maxTime={activeTimePicker === 'start' ? 22 : 23}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsTimePickerOpen(false)}
              className="btn-primary"
              style={{ backgroundColor: organization?.primaryColor }}
            >
              Готово
            </button>
            <button
              onClick={downloadICal}
              className="btn-primary"
              style={{ backgroundColor: organization?.primaryColor }}
          >
              Скачать .ics
              </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default BookingPage;