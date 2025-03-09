import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Plus, Image, MapPin, Clock } from 'lucide-react';
import {
  getCoworkingById,
  updateCoworking,
  deleteCoworking,
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  createPlace,
  updatePlace,
  deletePlace
} from '../modules/cowork/api';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { ROUTES } from '../config';
import FloorModals from '../modules/admin/components/FloorModals';
import CoworkingForm from '../modules/admin/components/CoworkingForm';
import FloorMapLeaflet from '../modules/cowork/components/FloorMapLeaflet';
import AddressSearch from '../modules/cowork/components/AddressSearch';
import FormField from '../shared/components/FormField';
import FileUpload from '../shared/components/FileUpload';
import LeafletMap from '../modules/cowork/components/LeafletMap';

const AdminCoworkingEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mapView, setMapView] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [is24Hours, setIs24Hours] = useState(false);

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
    photosToRemove: [] as number[],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [floors, setFloors] = useState<any[]>([]);
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [isEditFloorModalOpen, setIsEditFloorModalOpen] = useState(false);
  const [editingFloorIndex, setEditingFloorIndex] = useState(-1);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isConfirmDeleteFloorOpen, setIsConfirmDeleteFloorOpen] = useState(false);

  const [floorFormErrors, setFloorFormErrors] = useState<Record<string, string>>({});

  const [floorFormData, setFloorFormData] = useState({
    level: 1,
    mapImage: '',
    mapImageFile: null as File | null,
  });

  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const { data: coworking, isLoading: isLoadingCoworking, error: coworkingError } = useQuery({
    queryKey: ['coworking', id],
    queryFn: () => getCoworkingById(id!),
    enabled: !!id,
    retry: 1,
    onError: (error) => {
      console.error("Error fetching coworking:", error);
    }
  });

  const { data: floorsData, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', id],
    queryFn: () => getFloors(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (floorsData) {
      setFloors(floorsData);
    }
  }, [floorsData]);

  useEffect(() => {
    if (coworking) {
      // Определяем, является ли коворкинг круглосуточным
      const is24h = coworking.open_from == null && coworking.open_till == null;
      setIs24Hours(is24h);

      setFormData({
        name: coworking.name,
        description: coworking.description,
        address: coworking.address,
        coordinates: { ...coworking.coordinates },
        geoCoordinates: coworking.geoCoordinates || [55.751244, 37.618423],
        photos: [...coworking.photos],
        photoFiles: [],
        organizationId: coworking.organizationId,
        openFrom: is24h ? null : (coworking.open_from || 9),
        openTill: is24h ? null : (coworking.open_till || 18),
        hasWorkingHours: !is24h,
        photosToRemove: [],
      });
    }
  }, [coworking]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      // Create a new array with photos that should not be removed
      // const updatedPhotos = data.photos.filter((_: string, index: number) =>
        // !data.photosToRemove.includes(index)
      // );

      // Create a new data object without the photosToRemove field
      // const { photosToRemove, ...restData } = data;

      return updateCoworking({
        id: id!,
        ...data,
        remove_photos: data.photos
          .filter((_: string, idx: number) => data.photosToRemove.includes(idx))
          .map(x => x.split('/').slice(-1)[0]),
        // Если выбран режим 24/7, устанавливаем часы работы в null
        open_from: is24Hours ? null : data.openFrom,
        open_till: is24Hours ? null : data.openTill
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworking', id] });
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoworking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
      navigate(ROUTES.ADMIN_COWORKINGS);
    },
  });

  const createPlaceMutation = useMutation({
    mutationFn: ({ floorId, data }: { floorId: string; data: Omit<Place, 'id'> & { photoFile?: File } }) =>
      createPlace(id!, floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', id] });
    },
  });

  const updatePlaceMutation = useMutation({
    mutationFn: ({ floorId, placeId, data }: { floorId: string; placeId: string; data: Partial<Place> & { photoFile?: File | null } }) =>
      updatePlace(id!, floorId, placeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', id] });
    },
  });

  const deletePlaceMutation = useMutation({
    mutationFn: ({ floorId, placeId }: { floorId: string; placeId: string }) =>
      deletePlace(id!, floorId, placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', id] });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handle24HoursChange = () => {
    setIs24Hours(prev => !prev)
    setFormData(prev => ({
      ...prev,
      hasWorkingHours: is24Hours,
      openFrom: is24Hours ? null : (prev.openFrom || 9),
      openTill: is24Hours ? null : (prev.openTill || 18)
    }));
  };

  const handleOpenTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData(prev => ({ ...prev, openFrom: isNaN(value) ? null : value }));

    if (formErrors.openFrom) {
      setFormErrors(prev => ({ ...prev, openFrom: '' }));
    }
  };

  const handleCloseTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData(prev => ({ ...prev, openTill: isNaN(value) ? null : value }));

    if (formErrors.openTill) {
      setFormErrors(prev => ({ ...prev, openTill: '' }));
    }
  };

  const handleFloorNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFloorFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));

    if (floorFormErrors[name]) {
      setFloorFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFloorMapImageChange = (file: File | null) => {
    setFloorFormData(prev => ({ ...prev, mapImageFile: file }));

    if (floorFormErrors.mapImage) {
      setFloorFormErrors(prev => ({ ...prev, mapImage: '' }));
    }
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

  const handleRemovePhoto = (index: number) => {
    // Проверяем, что это не последняя фотография
    const remainingPhotos = formData.photos.filter((_, i) => !formData.photosToRemove.includes(i));
    if (remainingPhotos.length <= 1 && !formData.photosToRemove.includes(index)) {
      alert('Необходимо оставить хотя бы одну фотографию');
      return;
    }

    // Mark the photo for removal
    setFormData(prev => ({
      ...prev,
      photosToRemove: [...prev.photosToRemove, index]
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

    // Проверяем часы работы только если не выбран режим 24/7
    if (!is24Hours) {
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

    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот коворкинг?')) {
      deleteMutation.mutate(id!);
    }
  };

  const handleAddFloor = () => {
    setFloorFormData({
      level: floors.length + 1,
      mapImage: '',
      mapImageFile: null,
    });
    setFloorFormErrors({});
    setIsAddFloorModalOpen(true);
  };

  const handleEditFloor = (index: number) => {
    const floor = floors[index];
    setFloorFormData({
      level: floor.level,
      mapImage: floor.mapImage,
      mapImageFile: null,
    });
    setEditingFloorIndex(index);
    setFloorFormErrors({});
    setIsEditFloorModalOpen(true);
  };

  const handlePlaceCreate = (place: Place, floorId: string) => {
    const { id, ...placeData } = place;

    createPlaceMutation.mutate({
      floorId,
      data: placeData
    });
  };

  const handlePlaceUpdate = (place: Place, floorId: string) => {
    const { id: placeId, ...placeData } = place;

    updatePlaceMutation.mutate({
      floorId,
      placeId,
      data: placeData
    });
  };

  const handlePlaceDelete = (placeId: string, floorId: string) => {
    deletePlaceMutation.mutate({
      floorId,
      placeId
    });
  };

  const isLoading = isLoadingCoworking || isLoadingFloors;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (coworkingError) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ошибка загрузки коворкинга: {(coworkingError as Error).message}</p>
        <button
          onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Вернуться к списку коворкингов
        </button>
      </div>
    );
  }

  if (!coworking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Коворкинг не найден.</p>
        <button
          onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Вернуться к списку коворкингов
        </button>
      </div>
    );
  }

  // Filter out photos that are marked for removal for display purposes
  const displayPhotos = formData.photos.filter((_, index) => !formData.photosToRemove.includes(index));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Назад к списку коворкингов
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold">Редактирование коворкинга</h1>
        </div>

        <div className="p-6 mb-4">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`pb-3 px-4 font-medium ${
                activeTabIndex === 0
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTabIndex(0)}
              style={{
                color: activeTabIndex === 0 ? organization?.primaryColor : undefined,
                borderColor: activeTabIndex === 0 ? organization?.primaryColor : undefined
              }}
            >
              Основная информация
            </button>
            <button
              className={`pb-3 px-4 font-medium ${
                activeTabIndex === 1
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTabIndex(1)}
              style={{
                color: activeTabIndex === 1 ? organization?.primaryColor : undefined,
                borderColor: activeTabIndex === 1 ? organization?.primaryColor : undefined
              }}
            >
              Планы этажей
            </button>
          </div>

          {activeTabIndex === 0 && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

                <FormField
                  label="Название"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  error={formErrors.name}
                />

                <FormField
                  label="Описание"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  error={formErrors.description}
                  as="textarea"
                />
              </div>

              {/* Расположение */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Расположение</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <AddressSearch
                    onAddressSelect={handleAddressSelect}
                    initialAddress={formData.address}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                  )}
                </div>

                <div className="h-64 rounded-lg overflow-hidden mb-4">
                  <LeafletMap
                    coworkings={[{
                      id: 'new',
                      name: formData.name || 'Новый коворкинг',
                      description: formData.description || 'Новое пространство для коворкинга',
                      address: formData.address || 'Адрес',
                      coordinates: formData.coordinates,
                      geoCoordinates: formData.geoCoordinates,
                      photos: [],
                      organizationId: '1'
                    }]}
                    onMapClick={handleMapClick}
                    selectedCoworking={{
                      id: 'new',
                      name: formData.name || 'Новый коворкинг',
                      description: formData.description || 'Новое пространство для коворкинга',
                      address: formData.address || 'Адрес',
                      coordinates: formData.coordinates,
                      geoCoordinates: formData.geoCoordinates,
                      photos: [],
                      organizationId: '1'
                    }}
                    height="100%"
                    isAdmin={true}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md text-sm mb-4">
                  <p className="flex items-center text-gray-700">
                    <MapPin size={16} className="mr-2 text-primary" style={{ color: organization?.primaryColor }} />
                    <span>
                      {formData.address ? (
                        <>
                          Выбранный адрес: <strong>{formData.address}</strong>
                        </>
                      ) : (
                        'Выберите адрес с помощью поиска или кликните на карте для выбора местоположения'
                      )}
                    </span>
                  </p>
                  {formData.geoCoordinates && (
                    <p className="mt-1 text-gray-500 text-xs">
                      Координаты: {formData.geoCoordinates[0].toFixed(6)}, {formData.geoCoordinates[1].toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              {/* Часы работы */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Часы работы</h2>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-4">
                    <div className="relative inline-flex items-center">
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                              onClick={handle24HoursChange}  style={{ backgroundColor: is24Hours ? organization?.primaryColor : undefined }}
                              ></div>
                      <span className="ms-3 text-sm font-medium text-gray-900">Круглосуточно</span>
                    </div>
                  </div>

                  {!is24Hours && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Время открытия
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="openFrom"
                          value={formData.openFrom === null ? '' : formData.openFrom}
                          onChange={handleOpenTimeChange}
                          className="input w-full"
                        >
                          <option value="">Выберите время</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                        {formErrors.openFrom && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.openFrom}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Время закрытия
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          name="openTill"
                          value={formData.openTill === null ? '' : formData.openTill}
                          onChange={handleCloseTimeChange}
                          className="input w-full"
                        >
                          <option value="">Выберите время</option>
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                        {formErrors.openTill && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.openTill}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {is24Hours ? (
                      'Коворкинг работает круглосуточно'
                    ) : (
                      `Время работы: ${formData.openFrom !== null ? `${String(formData.openFrom).padStart(2, '0')}:00` : '--:--'} - ${formData.openTill !== null ? `${String(formData.openTill).padStart(2, '0')}:00` : '--:--'}`
                    )}
                  </div>
                </div>
              </div>

              {/* Фотографии */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Фотографии</h2>
                {displayPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {displayPhotos.map((photo: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Фото ${index + 1}`}
                          className="h-32 w-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-8 h-8"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">Нет существующих фотографий</p>
                )}

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Добавить новые фотографии
                </label>
                {formData.photoFiles.map((_: any, index: number) => (
                  <div key={`file-${index}`} className="mb-4">
                    <FileUpload
                      label={`Фото ${index + 1}`}
                      onChange={(file) => handlePhotoUpload(file, index)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhotoFile(index)}
                      className="text-red-600 hover:text-red-700 text-sm flex items-center mt-1"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Удалить
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="text-primary hover:text-primary/80 flex items-center text-sm"
                  style={{ color: organization?.primaryColor }}
                >
                  <Plus size={16} className="mr-1" />
                  Добавить фото
                </button>
              </div>

              {/* Кнопки действий */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn-danger h-10 flex items-center"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Удалить коворкинг
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
                      className="btn-secondary h-10"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="btn-primary flex items-center h-10"
                      disabled={updateMutation.isPending}
                      style={{ backgroundColor: organization?.primaryColor }}
                    >
                      <Save size={18} className="mr-2" />
                      {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTabIndex === 1 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Планы этажей</h2>
                <button
                  className="btn-primary h-10 flex items-center py-2"
                  onClick={handleAddFloor}
                  style={{ backgroundColor: organization?.primaryColor }}
                >
                  <Plus size={16} className="mr-1" />
                  Добавить этаж
                </button>
              </div>

              {floorsData && floorsData.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Image size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Нет планов этажей</h3>
                  <p className="text-gray-500 mb-4">Добавьте планы этажей для управления рабочими местами в этом коворкинге.</p>
                  <button
                    className="btn-primary h-10"
                    onClick={handleAddFloor}
                    style={{ backgroundColor: organization?.primaryColor }}
                  >
                    Добавить первый этаж
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {floorsData?.map((floor, index) => (
                    <div key={floor.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{floor.name}</h3>
                          <p className="text-sm text-gray-600">Этаж {floor.level}</p>
                        </div>
                        <button
                          className="text-primary hover:text-primary/80"
                          onClick={() => handleEditFloor(index)}
                          style={{ color: organization?.primaryColor }}
                        >
                          Редактировать этаж
                        </button>
                      </div>

                      <FloorMapLeaflet
                        floors={[floor]}
                        isAdmin={true}
                        onPlaceCreate={handlePlaceCreate}
                        onPlaceUpdate={handlePlaceUpdate}
                        onPlaceDelete={handlePlaceDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FloorModals
        coworkingId={id!}
        isAddModalOpen={isAddFloorModalOpen}
        isEditModalOpen={isEditFloorModalOpen}
        isConfirmDeleteOpen={isConfirmDeleteFloorOpen}
        onCloseAddModal={() => setIsAddFloorModalOpen(false)}
        onCloseEditModal={() => setIsEditFloorModalOpen(false)}
        onCloseConfirmDelete={() => setIsConfirmDeleteFloorOpen(false)}
        onAddDeleteModal={() => setIsConfirmDeleteFloorOpen(true)}
        floorFormData={floorFormData}
        floorFormErrors={floorFormErrors}
        handleFloorNumberChange={handleFloorNumberChange}
        handleFloorMapImageChange={handleFloorMapImageChange}
        editingFloorIndex={editingFloorIndex}
        floors={floors}
        organization={organization}
      />
    </div>
  );
};

export default AdminCoworkingEditPage;
