import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Coworking } from '../types';
import { ROUTES } from '../../../config';

interface CoworkingListProps {
  coworkings: Coworking[];
}

const CoworkingList: React.FC<CoworkingListProps> = ({ coworkings }) => {
  const navigate = useNavigate();

  const handleCoworkingClick = (id: string) => {
    navigate(ROUTES.COWORKING_DETAILS.replace(':id', id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coworkings.map((coworking) => (
        <div 
          key={coworking.id}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all cursor-pointer"
          onClick={() => handleCoworkingClick(coworking.id)}
        >
          <div className="h-48 overflow-hidden">
            <img 
              src={coworking.photos[0]} 
              alt={coworking.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">{coworking.name}</h3>
            <div className="flex items-center text-gray-600 mt-2">
              <MapPin size={16} className="mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{coworking.address}</span>
            </div>
            <p className="mt-2 text-gray-600 text-sm line-clamp-2">{coworking.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoworkingList;