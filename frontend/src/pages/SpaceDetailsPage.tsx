import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Building } from 'lucide-react';
import { getSpaceById, getCoworkingById } from '../modules/cowork/api';
import { getCurrentUser } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { ROUTES } from '../config';

const SpaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: space, isLoading: isLoadingSpace } = useQuery({
    queryKey: ['space', id],
    queryFn: () => getSpaceById(id!),
    enabled: !!id,
  });

  const { data: coworking, isLoading: isLoadingCoworking } = useQuery({
    queryKey: ['coworking', space?.coworkingId],
    queryFn: () => getCoworkingById(space!.coworkingId),
    enabled: !!space?.coworkingId,
  });

  const isLoading = isLoadingSpace || isLoadingCoworking;

  const handleBookNow = () => {
    if (space) {
      navigate(ROUTES.BOOKING.replace(':spaceId', space.id));
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

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Назад
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="relative h-80">
          <img 
            src={space.photo} 
            alt={space.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              space.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {space.status === 'available' ? 'Доступно' : 'Занято'}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{space.name}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-6">
            <div className="flex items-center mr-6 mb-2 sm:mb-0">
              <MapPin size={18} className="mr-2" />
              <span>{coworking.name}</span>
            </div>
            {space.floor && (
              <div className="flex items-center">
                <Building size={18} className="mr-2" />
                <span>Этаж {space.floor}</span>
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-8">{space.description}</p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold mb-2">Особенности</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Высокоскоростной Wi-Fi</li>
                <li>Эргономичное кресло</li>
                <li>Регулируемый стол</li>
                <li>Электрические розетки</li>
              </ul>
            </div>
            
            <div>
              {space.status === 'available' ? (
                <button 
                  onClick={handleBookNow}
                  className="btn-primary w-full sm:w-auto"
                  style={{ backgroundColor: organization?.primaryColor }}
                >
                  Забронировать
                </button>
              ) : (
                <button 
                  className="btn-secondary w-full sm:w-auto cursor-not-allowed"
                  disabled
                >
                  Сейчас занято
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailsPage;