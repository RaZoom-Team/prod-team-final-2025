import React from 'react';
import { TIME_SLOTS } from '../../../config';

interface TimePickerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  minTime?: number;
  maxTime?: number;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  label,
  minTime = 0,
  maxTime = 23
}) => {
  const filteredTimeSlots = TIME_SLOTS.filter(
    slot => slot.value >= minTime && slot.value <= maxTime
  );

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="input appearance-none pr-10"
        >
          {filteredTimeSlots.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TimePicker;