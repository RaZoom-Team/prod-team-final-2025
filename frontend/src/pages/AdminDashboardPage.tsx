import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Users, DollarSign, Calendar, QrCode, CheckCircle, XCircle, AlertCircle, Clock, MapPin, TrendingUp, Timer } from 'lucide-react';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getCoworkings } from '../modules/cowork/api/coworkingApi';
import { markVisitAsVisited } from '../modules/cowork/api/visitApi';
import { getSpaceById, getCoworkingById, getBookingById } from '../modules/cowork/api';
import { getMetrics } from '../modules/admin/api/metricsApi';
import QRCodeScanner from '../shared/components/QRCodeScanner';
import Modal from '../shared/components/Modal';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { ROUTES } from '../config';
import MetricsCard from '../shared/components/MetricsCard';
import PopularPlacesChart from '../shared/components/PopularPlacesChart';
import RecentBookingsTable from '../shared/components/RecentBookingsTable';

const AdminDashboardPage: React.FC = () => {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [showScanError, setShowScanError] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [visitDetails, setVisitDetails] = useState<{
    buildingId: string | number;
    placeId: string | number;
    visitId: string | number;
  } | null>(null);
  const [scannedBooking, setScannedBooking] = useState<any>(null);
  const [scannedSpace, setScannedSpace] = useState<any>(null);
  const [scannedCoworking, setScannedCoworking] = useState<any>(null);
  const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: coworkings = [] } = useQuery({
    queryKey: ['coworkings'],
    queryFn: getCoworkings,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Получение метрик
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 60000, // Обновлять каждую минуту
  });

  // Проверка размера экрана при изменении окна
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Очистка таймаутов при размонтировании компонента
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Mark visit as visited mutation
  const markVisitMutation = useMutation({
    mutationFn: ({ buildingId, placeId, visitId }: { buildingId: number | string, placeId: number | string, visitId: number | string }) => 
      markVisitAsVisited(Number(buildingId), Number(placeId), Number(visitId)),
    onSuccess: () => {
      setShowScanSuccess(true);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = setTimeout(() => {
        setShowScanSuccess(false);
      }, 3000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
    onError: (error: Error) => {
      setScanErrorMessage(error.message || 'Не удалось отметить посещение');
      setShowScanError(true);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = setTimeout(() => {
        setShowScanError(false);
      }, 5000);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleScanResult = async (result: string) => {
    try {
      // Parse the QR code data
      let decodedData;
      try {
        // First try to parse as is
        decodedData = JSON.parse(result);
      } catch (e) {
        // If that fails, try with decodeURIComponent
        try {
          decodedData = JSON.parse(decodeURIComponent(result));
        } catch (e2) {
          // If both fail, try to extract JSON from the string
          const jsonMatch = result.match(/({.*})/);
          if (jsonMatch && jsonMatch[1]) {
            decodedData = JSON.parse(jsonMatch[1]);
          } else {
            // Вместо ошибки просто продолжаем сканирование
            return;
          }
        }
      }
      
      // Check if the data has the expected format
      if (!decodedData.buildingId || !decodedData.placeId || !decodedData.visitId) {
        // Вместо ошибки просто продолжаем сканирование
        return;
      }
      
      setVisitDetails(decodedData);
      setIsProcessing(true);
      setIsQrScannerOpen(false);
      
      // Fetch booking details
      try {
        // First get the space details
        const space = await getSpaceById(decodedData.placeId.toString());
        setScannedSpace(space);
        
        // Then get the coworking details
        const coworking = await getCoworkingById(decodedData.buildingId.toString());
        setScannedCoworking(coworking);
        
        // Try to get booking details if possible
        try {
          // Now we use the actual visit ID directly
          const booking = await getBookingById(decodedData.visitId.toString());
          setScannedBooking(booking);
        } catch (error) {
          console.log('Could not fetch booking details, using visit data instead');
          // Create a minimal booking object from the visit data
          setScannedBooking({
            id: decodedData.visitId.toString(),
            spaceId: decodedData.placeId.toString(),
            status: 'pending'
          });
        }
        
        // Show booking details modal
        setIsBookingDetailsOpen(true);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        // If we can't get details, still allow marking the visit
        setIsBookingDetailsOpen(true);
      }
      
      setScanResult(`Здание: ${decodedData.buildingId}, Место: ${decodedData.placeId}, Визит: ${decodedData.visitId}`);
    } catch (error) {
      console.error('Ошибка обработки QR-кода:', error);
      
      // Вместо ошибки просто продолжаем сканирование
      return;
    }
  };

  // Mark visit as visited
  const handleMarkVisit = () => {
    if (!visitDetails) return;
    
    markVisitMutation.mutate({
      buildingId: visitDetails.buildingId,
      placeId: visitDetails.placeId,
      visitId: visitDetails.visitId
    });
    
    setIsBookingDetailsOpen(false);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Форматирование минут в часы и минуты
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} мин`;
    } else if (mins === 0) {
      return `${hours} ч`;
    } else {
      return `${hours} ч ${mins} мин`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Панель администратора</h1>
      
      {/* QR-код сканер - перемещен выше метрик */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Сканирование QR-кода</h2>
            <p className="text-gray-600">
              Отсканируйте QR-код бронирования, чтобы отметить посещение клиента или проверить детали бронирования.
            </p>
          </div>
          <button 
            onClick={() => setIsQrScannerOpen(true)}
            className={`btn-primary flex items-center justify-center ${isMobile ? 'w-full py-4 text-lg' : ''}`}
            style={{ backgroundColor: organization?.primaryColor }}
          >
            <QrCode size={isMobile ? 24 : 18} className={isMobile ? "mr-3" : "mr-2"} />
            Сканировать QR-код
          </button>
        </div>
      </div>
      
      {/* Метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricsCard 
          title="Всего мест" 
          value={metrics?.coworking_count || 0} 
          icon={<BarChart />}
          isLoading={isLoadingMetrics}
        />
        
        <MetricsCard 
          title="Пользователи" 
          value={metrics?.user_count || 0} 
          icon={<Users />}
          color="#10b981"
          isLoading={isLoadingMetrics}
        />
        
        <MetricsCard 
          title="Бронирования" 
          value={metrics?.total_bookings || 0} 
          icon={<Calendar />}
          color="#8b5cf6"
          isLoading={isLoadingMetrics}
        />
        
        <MetricsCard 
          title="Среднее время посещения" 
          value={metrics?.average_visit_duration_minutes || 0} 
          icon={<Timer />}
          color="#f59e0b"
          isLoading={isLoadingMetrics}
          formatter={(val) => formatDuration(Number(val))}
        />
      </div>

      {/* Популярные места и последние бронирования */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Популярные места */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp size={20} className="mr-2 text-primary" style={{ color: organization?.primaryColor }} />
            Популярные места
          </h2>
          
          <PopularPlacesChart 
            data={metrics?.most_popular_places || []} 
            isLoading={isLoadingMetrics}
          />
        </div>
        
        {/* Последние бронирования */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-primary" style={{ color: organization?.primaryColor }} />
            Последние бронирования
          </h2>
          
          <RecentBookingsTable 
            bookings={metrics?.last_bookings || []} 
            isLoading={isLoadingMetrics}
          />
        </div>
      </div>
      
      {/* QR Code Scanner */}
      {isQrScannerOpen && (
        <QRCodeScanner 
          onScan={handleScanResult}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}
      
      {/* Success Toast */}
      {showScanSuccess && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-[1000] animate-fade-in-up">
          <CheckCircle size={20} className="mr-2" />
          <div>
            <p className="font-medium">Посещение успешно отмечено</p>
            {scanResult && (
              <p className="text-sm text-green-100">{scanResult}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Error Toast */}
      {showScanError && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-[1000] animate-fade-in-up">
          <XCircle size={20} className="mr-2" />
          <div>
            <p className="font-medium">Ошибка</p>
            <p className="text-sm text-red-100">{scanErrorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Booking Details Modal */}
      <Modal
        isOpen={isBookingDetailsOpen}
        onClose={() => setIsBookingDetailsOpen(false)}
        title="Детали бронирования"
        maxWidth="max-w-lg"
      >
        {visitDetails && (
          <div className="space-y-4">
            {scannedSpace && scannedCoworking ? (
              <>
                <div className="flex items-center mb-4">
                  {scannedSpace.photo && (
                    <img 
                      src={scannedSpace.photo} 
                      alt={scannedSpace.name}
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{scannedSpace.name}</h3>
                    <p className="text-gray-600">{scannedCoworking.name}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Дата</p>
                      <p className="font-medium">{formatDate(scannedBooking?.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Время</p>
                      <p className="font-medium">
                        {formatTime(scannedBooking?.startTime)} - {formatTime(scannedBooking?.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Статус</p>
                      <p className="font-medium">
                        {scannedBooking?.isVisited ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            Посещено
                          </span>
                        ) : (
                          <span className="text-amber-600">Ожидает посещения</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ID бронирования</p>
                      <p className="font-medium">{scannedBooking?.id}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-yellow-600 mr-2" />
                  <p className="text-yellow-700">
                    Не удалось загрузить полную информацию о бронировании. Возможно, место или коворкинг были удалены.
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">ID бронирования: {visitDetails.visitId}</p>
                  <p className="text-sm text-gray-600">ID места: {visitDetails.placeId}</p>
                  <p className="text-sm text-gray-600">ID коворкинга: {visitDetails.buildingId}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                className="btn-secondary"
                onClick={() => setIsBookingDetailsOpen(false)}
              >
                Закрыть
              </button>
              {!scannedBooking?.isVisited && (
                <button
                  className="btn-primary"
                  onClick={handleMarkVisit}
                  disabled={markVisitMutation.isPending}
                  style={{ backgroundColor: organization?.primaryColor }}
                >
                  {markVisitMutation.isPending ? 'Обработка...' : 'Отметить посещение'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;