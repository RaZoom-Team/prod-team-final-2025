import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import { PopularPlaceViewForMetrics } from '../../modules/admin/api/metricsApi';

interface PopularPlacesChartProps {
  data: PopularPlaceViewForMetrics[];
  isLoading?: boolean;
}

const PopularPlacesChart: React.FC<PopularPlacesChartProps> = ({ data, isLoading = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const primaryColor = organization?.primaryColor || '#3044FF';
  
  // Находим максимальное значение для масштабирования
  const maxVisitCount = data.length > 0 
    ? Math.max(...data.map(place => place.visit_count)) 
    : 10;
  
  // Анимация при загрузке данных
  useEffect(() => {
    if (isLoading || !chartRef.current || animated) return;
    
    const bars = chartRef.current.querySelectorAll('.bar-fill');
    
    // Сначала устанавливаем ширину всех баров в 0
    bars.forEach((bar) => {
      (bar as HTMLElement).style.width = '0%';
    });
    
    // Затем анимируем их с задержкой
    setTimeout(() => {
      bars.forEach((bar, index) => {
        setTimeout(() => {
          (bar as HTMLElement).style.width = `${(data[index].visit_count / maxVisitCount) * 100}%`;
        }, index * 150); // Увеличенная задержка для более заметной анимации
      });
      setAnimated(true);
    }, 300);
    
  }, [data, isLoading, maxVisitCount, animated]);

  // Сбрасываем флаг анимации при изменении данных
  useEffect(() => {
    setAnimated(false);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет данных о популярных местах
      </div>
    );
  }

  return (
    <div ref={chartRef} className="space-y-4">
      {data.map((place, index) => (
        <div key={place.id} className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{place.name}</span>
            <span className="text-sm text-gray-500">{place.visit_count} посещений</span>
          </div>
          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="bar-fill h-full rounded-full transition-all duration-1000 ease-out flex items-center pl-3"
              style={{ 
                width: '0%', 
                backgroundColor: primaryColor,
                opacity: 0.8 - (index * 0.1)
              }}
            >
              <span className="text-xs font-medium text-white">
                {place.building_name}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularPlacesChart;