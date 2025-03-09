import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Space } from '../types';
import { ROUTES } from '../../../config';

interface SpaceListProps {
  spaces: Space[];
  showCoworkingName?: boolean;
}

const SpaceList: React.FC<SpaceListProps> = ({ spaces, showCoworkingName = false }) => {
  const navigate = useNavigate();

  const handleSpaceClick = (id: string) => {
    navigate(ROUTES.SPACE_DETAILS.replace(':id', id));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {spaces.map((space) => (
        <div 
          key={space.id}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all cursor-pointer"
          onClick={() => handleSpaceClick(space.id)}
        >
          <div className="h-32 overflow-hidden relative">
            <img 
              src={space.photo} 
              alt={space.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                space.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {space.status === 'available' ? 'Available' : 'Occupied'}
              </span>
            </div>
          </div>
          <div className="p-2">
            <h3 className="text-sm font-medium text-gray-800 truncate">{space.name}</h3>
            {space.floor && (
              <div className="text-xs text-gray-500 mt-1">
                Floor: {space.floor}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpaceList;