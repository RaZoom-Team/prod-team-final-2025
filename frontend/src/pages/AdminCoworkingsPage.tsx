import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, X, MapPin, QrCode, Clock, Grid, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCoworkings, createCoworking, deleteCoworking, geocodeAddress } from '../modules/cowork/api';
import { Coworking } from '../modules/cowork/types';
import LeafletMap from '../modules/cowork/components/LeafletMap';
import AddressSearch from '../modules/cowork/components/AddressSearch';
import FileUpload from '../shared/components/FileUpload';
import BottomSheet from '../shared/components/BottomSheet';
import Modal from '../shared/components/Modal';
import FormField from '../shared/components/FormField';
import QRCodeScanner from '../shared/components/QRCodeScanner';
import TimePicker from '../shared/components/TimePicker';
import { ROUTES } from '../config';
import { getOrganization } from '../modules/admin/api/organizationApi';

const AdminCoworkingsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const initialFormState = {
    name: '',
    description: '',
    address: '',
    coordinates: { x: 500, y: 500 },
    geoCoordinates: [55.751244, 37.618423] as [number, number],
    photos: [] as string[],
    photoFiles: [] as File[],
    organizationId: '1',
    openFrom: null as number | null,
    openTill: null as number | null,
    hasWorkingHours: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedCoworking, setSelectedCoworking] = useState<Coworking | null>(null);

  const { data: coworkings = [], isLoading } = useQuery({
    queryKey: ['coworkings'],
    queryFn: getCoworkings,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const createMutation = useMutation({
    mutationFn: createCoworking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
      setIsModalOpen(false);
      setFormData(initialFormState);
      setFormErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoworking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
      setIsBottomSheetOpen(false);
    },
  });

  const handleOpenModal = () => {
    // Вместо открытия модального окна перенаправляем на страницу создания
    navigate(ROUTES.ADMIN_COWORKINGS + '/create');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [name]: parseInt(value, 10),
      },
    }));
  };

  const handleOpenTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, openFrom: value }));
  };

  const handleCloseTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, openTill: value }));
  };

  const handlePhotoUpload = (file: File | null, index: number) => {
    if (file) {
      const updatedPhotoFiles = [...formData.photoFiles];
      updatedPhotoFiles[index] = file;
      setFormData(prev => ({ ...prev, photoFiles: updatedPhotoFiles }));
    }
  };

  const handleAddPhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      photoFiles: [...prev.photoFiles, null as unknown as File] 
    }));
  };

  const handleRemovePhotoFile = (index: number) => {
    const updatedPhotoFiles = [...formData.photoFiles];
    updatedPhotoFiles.splice(index, 1);
    setFormData(prev => ({ ...prev, photoFiles: updatedPhotoFiles }));
  };

  const handleMapClick = (coords: [number, number]) => {
    setFormData(prev => ({
      ...prev,
      geoCoordinates: coords,
      // Преобразуем географические координаты в формат API
      coordinates: {
        x: coords[1], // longitude -> x
        y: coords[0]  // latitude -> y
      }
    }));
  };

  const handleAddressSelect = (address: string, coordinates: [number, number]) => {
    setFormData(prev => ({
      ...prev,
      address,
      geoCoordinates: coordinates,
      // Преобразуем географические координаты в формат API
      coordinates: {
        x: coordinates[1], // longitude -> x
        y: coordinates[0]  // latitude -> y
      }
    }));
    
    // Clear address error if it exists
    if (formErrors.address) {
      setFormErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Название обязательно';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Адрес обязателен';
    }
    
    if (formData.hasWorkingHours) {
      if (formData.openFrom === null) {
        errors.openFrom = 'Время открытия обязательно';
      }
      
      if (formData.openTill === null) {
        errors.openTill = 'Время закрытия обязательно';
      }
      
      if (formData.openFrom !== null && formData.openTill !== null && formData.openFrom >= formData.openTill) {
        errors.openTill = 'Время закрытия должно быть позже времени открытия';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare data for API
    const submitData = {
      ...formData,
      // Only include working hours if enabled
      open_from: formData.hasWorkingHours ? formData.openFrom : null,
      open_till: formData.hasWorkingHours ? formData.openTill : null,
    };
    
    createMutation.mutate(submitData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот коворкинг?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleMapView = () => {
    setMapView(!mapView);
  };

  const openBottomSheet = (coworking: Coworking) => {
    setSelectedCoworking(coworking);
    setIsBottomSheetOpen(true);
  };
  
  const handleEditCoworking = (coworking: Coworking) => {
    navigate(`/admin/coworkings/${coworking.id}`);
  };

  const handleScanResult = (result: string) => {
    console.log('QR Code scanned:', result);
    setScanResult(result);
    setIsQrScannerOpen(false);
    setShowScanSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowScanSuccess(false);
    }, 3000);
  };

  // Format time for display
  const formatTime = (hour: number | null): string => {
    console.log(hour)
    if (hour === null) return 'Не указано';
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const handleCoworkingSelect = (coworking: Coworking) => {
    setSelectedCoworking(coworking);
    setIsBottomSheetOpen(true);
  };

  // Check if coworking has working hours
  const hasWorkingHours = (coworking: Coworking): boolean => {
    return coworking.open_from !== null && coworking.open_till !== null;
  };

  return (
    <div className=''>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Коворкинги</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button 
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Вид сеткой"
            >
              <Grid size={18} />
            </button>
            <button 
              className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('map')}
              aria-label="Вид на карте"
            >
              <Map size={18} />
            </button>
          </div>
          <button 
            className="btn-primary flex items-center py-2 px-3 text-sm"
            onClick={handleOpenModal}
            style={{ backgroundColor: organization?.primaryColor }}
          >
            <PlusCircle size={16} className="mr-1" />
            Добавить
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[calc(100vh-180px)] min-h-[500px] relative">
          <LeafletMap 
            coworkings={coworkings} 
            onCoworkingSelect={handleCoworkingSelect}
            selectedCoworking={selectedCoworking}
            height="100%"
            sidebarPosition="left"
          />
          
          {/* Desktop sidebar for selected coworking */}
          {selectedCoworking && window.innerWidth >= 768 && (
            <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-lg z-10 overflow-y-auto">
              <div className="p-4">
                {selectedCoworking.photos && selectedCoworking.photos.length > 0 && (
                  <img 
                    src={selectedCoworking.photos[0]} 
                    alt={selectedCoworking.name}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                )}
                
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{selectedCoworking.name}</h3>
                
                <div className="flex items-center mt-1 text-gray-600 text-sm mb-2">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{selectedCoworking.address}</span>
                </div>
                
                <div className="text-gray-600 text-sm mb-3 flex items-center">
                  <Clock size={16} className="mr-1 flex-shrink-0" />
                  {selectedCoworking.open_from && selectedCoworking.open_till ? (
                    <span>
                      {formatTime(selectedCoworking.open_from)} - {formatTime(selectedCoworking.open_till)}
                    </span>
                  ) : (
                    <span>Открыто 24/7</span>
                  )}
                </div>
                
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {selectedCoworking.description}
                </p>
                
                {selectedCoworking.photos.length > 1 && (
                  <div className="mb-4">
                    <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
                      {selectedCoworking.photos.slice(0, 5).map((photo, index) => (
                        <div key={index} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                          <img 
                            src={photo} 
                            alt={`${selectedCoworking.name} - Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      handleEditCoworking(selectedCoworking);
                    }}
                    className="btn-primary flex-1"
                    style={{ backgroundColor: organization?.primaryColor }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => {
                      setIsBottomSheetOpen(false);
                      handleDelete(selectedCoworking.id);
                    }}
                    className="btn-danger flex-1"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {coworkings.map((coworking) => (
            <div 
              key={coworking.id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleEditCoworking(coworking)}
            >
              <div className="h-28 overflow-hidden">
                <img 
                  src={coworking.photos[0]} 
                  alt={coworking.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="font-medium text-gray-800 text-sm truncate">{coworking.name}</h3>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <MapPin size={10} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{coworking.address}</span>
                </div>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock size={10} className="mr-1 flex-shrink-0" />
                  {coworking.open_from && coworking.open_till ? (
                    <span>
                      {formatTime(coworking.open_from)} - {formatTime(coworking.open_till)}
                    </span>
                  ) : (
                    <span>Открыто 24/7</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {coworkings.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Коворкинги не найдены. Добавьте свой первый коворкинг!</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Sheet for mobile */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={selectedCoworking ? selectedCoworking.name : ''}
      >
        {selectedCoworking && (
          <div className="space-y-4">
            <div className="mb-4">
              <img 
                src={selectedCoworking.photos[0]} 
                alt={selectedCoworking.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <p className="text-gray-600">{selectedCoworking.description}</p>
            
            <p className="text-gray-600 flex items-center">
              <MapPin size={16} className="mr-2" />
              {selectedCoworking.address}
            </p>
            
            <p className="text-gray-600 flex items-center">
              <Clock size={16} className="mr-2" />
              {hasWorkingHours(selectedCoworking) ? (
                <span>
                  {formatTime(selectedCoworking.open_from)} - {formatTime(selectedCoworking.open_till)}
                </span>
              ) : (
                <span>Открыто 24/7</span>
              )}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {selectedCoworking.photos.slice(0, 4).map((photo, index) => (
                <div key={index} className="h-32 rounded-xl overflow-hidden">
                  <img 
                    src={photo} 
                    alt={`${selectedCoworking.name} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  handleEditCoworking(selectedCoworking);
                }}
                className="btn-primary flex-1"
                style={{ backgroundColor: organization?.primaryColor }}
              >
                Редактировать
              </button>
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  handleDelete(selectedCoworking.id);
                }}
                className="btn-danger flex-1"
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AdminCoworkingsPage;