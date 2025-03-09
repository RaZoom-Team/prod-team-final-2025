  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
  import { ArrowLeft, Save, MapPin } from 'lucide-react';
  import { createCoworking } from '../modules/cowork/api';
  import { getOrganization } from '../modules/admin/api/organizationApi';
  import { ROUTES } from '../config';
  import FormField from '../shared/components/FormField';
  import FileUpload from '../shared/components/FileUpload';
  import AddressSearch from '../modules/cowork/components/AddressSearch';
  import LeafletMap from '../modules/cowork/components/LeafletMap';

  const AdminCoworkingCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [mapView, setMapView] = useState(true);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

    const { data: organization } = useQuery({
      queryKey: ['organization'],
      queryFn: getOrganization,
    });

    const createMutation = useMutation({
      mutationFn: (data) => createCoworking(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['coworkings'] });
        navigate(ROUTES.ADMIN_COWORKINGS);
      },
    });

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

    const handleOpenTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      setFormData(prev => ({ ...prev, openFrom: isNaN(value) ? null : value }));
    };

    const handleCloseTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(e.target.value, 10);
      setFormData(prev => ({ ...prev, openTill: isNaN(value) ? null : value }));
    };

    const handlePhotoUpload = (file: File | null, index: number) => {
      if (file) {
        const updatedPhotoFiles = [...formData.photoFiles];
        updatedPhotoFiles[index] = file;
        setFormData(prev => ({ ...prev, photoFiles: updatedPhotoFiles }));

        // Clear photo error if it exists
        if (formErrors.photos) {
          setFormErrors(prev => ({ ...prev, photos: '' }));
        }
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
      console.log("Выбраны координаты:", coords);
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
      console.log("Выбран адрес:", address, "с координатами:", coordinates);
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

      if (formData.photoFiles.length === 0) {
        errors.photos = 'Необходимо добавить хотя бы одну фотографию';
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
        open_from: formData.hasWorkingHours ? (formData.openFrom * 3600) : null,
        open_till: formData.hasWorkingHours ? (formData.openTill * 3600) : null,
      };

      console.log("Отправляемые данные:", submitData);
      createMutation.mutate(submitData);
    };

    return (
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold">Создание нового коворкинга</h1>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
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

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="hasWorkingHours"
                      name="hasWorkingHours"
                      checked={formData.hasWorkingHours}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="hasWorkingHours" className="ml-2 block text-sm font-medium text-gray-700">
                      Установить часы работы
                    </label>
                  </div>

                  {formData.hasWorkingHours && (
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
                </div>

                {/* Фотографии */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Фотографии</h2>

                  {formErrors.photos && (
                    <p className="mb-3 text-sm text-red-600">{formErrors.photos}</p>
                  )}

                  {formData.photoFiles.map((_, index) => (
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Добавить фото
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.ADMIN_COWORKINGS)}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={createMutation.isPending}
                      style={{ backgroundColor: organization?.primaryColor }}
                    >
                      {createMutation.isPending ? 'Создание...' : 'Создать коворкинг'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default AdminCoworkingCreatePage;
