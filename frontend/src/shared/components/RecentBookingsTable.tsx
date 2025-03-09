import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import { LastBookingViewForMetrics } from '../../modules/admin/api/metricsApi';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface RecentBookingsTableProps {
  bookings: LastBookingViewForMetrics[];
  isLoading?: boolean;
}

const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({ 
  bookings, 
  isLoading = false 
}) => {
  const [visibleRows, setVisibleRows] = useState<number[]>([]);
  
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Анимация появления строк таблицы
  useEffect(() => {
    if (isLoading || bookings.length === 0) {
      setVisibleRows([]);
      return;
    }
    
    // Сначала очищаем видимые строки
    setVisibleRows([]);
    
    // Затем постепенно добавляем их с анимацией
    bookings.forEach((_, index) => {
      setTimeout(() => {
        setVisibleRows(prev => [...prev, index]);
      }, index * 150); // Задержка между появлением строк
    });
  }, [bookings, isLoading]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'numeric',
      year: 'numeric'
    });
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Форматирование длительности
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

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет данных о недавних бронированиях
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Пользователь
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Место
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Время
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Длительность
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking, index) => (
            <tr 
              key={booking.id} 
              className={`hover:bg-gray-50 transition-all duration-300 ${
                visibleRows.includes(index) 
                  ? 'opacity-100 transform translate-y-0' 
                  : 'opacity-0 transform translate-y-4'
              }`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{booking.client_name}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{booking.place_name}</div>
                <div className="text-xs text-gray-500">{booking.building_name}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(booking.visit_from)}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatTime(booking.visit_from)} - {formatTime(booking.visit_till)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Clock size={16} className="mr-1 text-gray-400" />
                  {formatDuration(booking.duration_minutes)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {booking.is_visited ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle size={16} className="mr-1" />
                    <span className="text-sm">Посещено</span>
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500">
                    <XCircle size={16} className="mr-1" />
                    <span className="text-sm">Не посещено</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentBookingsTable;