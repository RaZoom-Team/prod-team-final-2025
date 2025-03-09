import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import CountUp from 'react-countup';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  isLoading?: boolean;
  formatter?: (value: number | string) => string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  isLoading = false,
  formatter = (val) => val.toString()
}) => {
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Преобразуем значение в число для CountUp
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0;
  
  // Форматирование для CountUp
  const formatCountUp = (val: number) => {
    return formatter(val);
  };

  const cardColor = color || organization?.primaryColor || '#3044FF';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        <div className={`p-2 rounded-full`} style={{ backgroundColor: `${cardColor}15` }}>
          {React.cloneElement(icon as React.ReactElement, { 
            size: 20, 
            className: "text-primary",
            style: { color: cardColor } 
          })}
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <div className="text-3xl font-bold">
          <CountUp
            start={0}
            end={numericValue}
            duration={2}
            separator=" "
            decimals={numericValue % 1 !== 0 ? 2 : 0}
            decimal="."
            formattingFn={formatCountUp}
            useEasing={true}
            preserveValue={true}
            redraw={false}
          />
        </div>
      )}
      
      {/* Декоративный элемент */}
      <div 
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: cardColor }}
      ></div>
    </div>
  );
};

export default MetricsCard;