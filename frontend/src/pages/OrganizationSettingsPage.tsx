import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { getOrganization, updateOrganization } from '../modules/admin/api/organizationApi';
import { addAdminUser } from '../modules/user/api/authApi';
import { getAdmins, removeAdmin } from '../modules/user/api/userApi';
import { User } from '../modules/user/types';
import FormField from '../shared/components/FormField';
import FileUpload from '../shared/components/FileUpload';
import { ACCENT_COLORS } from '../config';
import { API_BASE_URL } from '../config';

const OrganizationSettingsPage: React.FC = () => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    primaryColor: ACCENT_COLORS[0].value,
  });

  // Get organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Update form when organization data is loaded
  React.useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        logo: organization.logo || '',
        primaryColor: organization.primaryColor,
      });
    }
  }, [organization]);

  // Fetch admins
  const { data: admins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  });

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: addAdminUser,
    onSuccess: () => {
      setNewAdminEmail('');
      setSuccess('Администратор успешно добавлен');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setSuccess(null);
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: removeAdmin,
    onSuccess: () => {
      setSuccess('Администратор успешно удален');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setSuccess(null);
    },
  });

  // Update organization mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      setSuccess('Настройки организации успешно обновлены');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message || 'Произошла ошибка при обновлении настроек организации');
      setSuccess(null);
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/files`, {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить логотип');
      }
      
      const data = await response.json();
      return data.image_id;
    },
    onSuccess: (imageId) => {
      // Update organization with new logo
      updateOrganizationMutation.mutate({
        ...formData,
        logo: `${API_BASE_URL}/files/${imageId}`,
      });
    },
    onError: (error: Error) => {
      setError(`Ошибка загрузки логотипа: ${error.message}`);
      setFormErrors(prev => ({ ...prev, logo: 'Не удалось загрузить логотип' }));
    },
  });

  const validateOrgForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Название организации обязательно';
    }
    
    // Validate logo - either existing logo or new file is required
    if (!formData.logo && !logoFile) {
      errors.logo = 'Логотип организации обязателен';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAdminForm = (): boolean => {
    if (!newAdminEmail.trim()) {
      setError('Email обязателен');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      setError('Пожалуйста, введите корректный email');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAdminForm()) {
      return;
    }
    
    addAdminMutation.mutate(newAdminEmail);
  };

  const handleRemoveAdmin = (id: string) => {
    removeAdminMutation.mutate(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, primaryColor: color }));
  };

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    // Clear logo error when a new file is selected
    if (file && formErrors.logo) {
      setFormErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleSaveOrganization = () => {
    if (!validateOrgForm()) {
      return;
    }
    
    // If there's a new logo file, upload it first
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    } else {
      // Otherwise just update the organization
      updateOrganizationMutation.mutate(formData);
    }
  };

  const isLoading = isLoadingOrg || isLoadingAdmins;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Настройки организации</h1>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Профиль организации</h2>
        
        <div className="space-y-4">
          <FormField
            label="Название организации"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            error={formErrors.name}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Логотип
              <span className="text-red-500 ml-1">*</span>
            </label>
            <FileUpload
              label=""
              onChange={handleLogoChange}
              value={formData.logo}
            />
            {formErrors.logo && (
              <p className="mt-1 text-sm text-red-600">{formErrors.logo}</p>
            )}
          </div>
          
          {formData.logo && !logoFile && (
            <div className="mt-2">
              <img 
                src={formData.logo} 
                alt="Логотип организации" 
                className="h-16 object-contain"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Основной цвет
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {ACCENT_COLORS.map(color => (
                <div 
                  key={color.value}
                  className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center ${
                    formData.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color.value)}
                  title={color.name}
                >
                  {formData.primaryColor === color.value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center">
              <div 
                className="w-10 h-10 rounded mr-2"
                style={{ backgroundColor: formData.primaryColor }}
              ></div>
              <input
                type="text"
                value={formData.primaryColor}
                onChange={handleInputChange}
                name="primaryColor"
                className="input"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              className="btn-primary flex items-center"
              onClick={handleSaveOrganization}
              disabled={updateOrganizationMutation.isPending || uploadLogoMutation.isPending}
              style={{ backgroundColor: formData.primaryColor }}
            >
              <Save size={18} className="mr-2" />
              {updateOrganizationMutation.isPending || uploadLogoMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Администраторы</h2>
        
        <form onSubmit={handleAddAdmin} className="mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="email"
              placeholder="Email адрес"
              className={`input w-full sm:flex-grow ${error ? 'border-red-500' : ''}`}
              value={newAdminEmail}
              onChange={(e) => {
                setNewAdminEmail(e.target.value);
                setError(null);
              }}
            />
            <button 
              type="submit" 
              className="btn-primary flex items-center whitespace-nowrap w-full sm:w-auto"
              disabled={addAdminMutation.isPending}
              style={{ backgroundColor: formData.primaryColor }}
            >
              <PlusCircle size={18} className="mr-2" />
              {addAdminMutation.isPending ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
        
        <div className="overflow-x-auto">
          {/* Desktop view */}
          <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin: User) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-red-600 hover:text-red-900 flex items-center ml-auto"
                      disabled={removeAdminMutation.isPending}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    Администраторы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile view */}
          <div className="md:hidden">
            {admins.map((admin: User) => (
              <div key={admin.id} className="bg-gray-50 p-4 rounded-lg mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{admin.name}</h3>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id)}
                    className="text-red-600 p-2"
                    disabled={removeAdminMutation.isPending}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Администраторы не найдены
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettingsPage;