import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  minTime?: number;
  maxTime?: number;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  label,
  minTime = 0,
  maxTime = 23,
  className = ''
}) => {
  const [timeSlots, setTimeSlots] = useState<{ value: number; label: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });
  
  // Generate time slots
  useEffect(() => {
    const slots = Array.from({ length: maxTime - minTime + 1 }, (_, i) => ({
      value: minTime + i,
      label: `${String(minTime + i).padStart(2, '0')}:00`
    }));
    setTimeSlots(slots);
  }, [minTime, maxTime]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format time for display
  const formatTime = (hour: number): string => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  // Handle time selection
  const handleTimeSelect = (hour: number) => {
    onChange(hour);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (value > minTime) {
          onChange(value - 1);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (value < maxTime) {
          onChange(value + 1);
        }
        break;
      case 'Enter':
      case ' ':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div 
        className="relative"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div 
          className="input w-full flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <Clock size={18} className="mr-2 text-gray-500" />
            <span>{formatTime(value)}</span>
          </div>
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="fill-current h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            <div className="py-1">
              {timeSlots.map((slot) => (
                <div
                  key={slot.value}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                    slot.value === value ? 'bg-gray-50 font-medium' : ''
                  }`}
                  onClick={() => handleTimeSelect(slot.value)}
                  role="option"
                  aria-selected={slot.value === value}
                  style={slot.value === value ? { color: organization?.primaryColor } : undefined}
                >
                  <span>{slot.label}</span>
                  {slot.value === value && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;