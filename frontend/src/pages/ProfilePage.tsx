import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, User as UserIcon, Shield, Edit, Save } from 'lucide-react';
import { getCurrentUser, updateUserProfile } from '../modules/user/api/userApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { ROUTES } from '../config';
import FormField from '../shared/components/FormField';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Initialize form when user data is loaded
  React.useEffect(() => {
    if (user) {
      setUserName(user.name);
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not found');
      return updateUserProfile(user.id, { name });
    },
    onSuccess: (updatedUser) => {
      // Update the user in the cache
      queryClient.setQueryData(['currentUser'], updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    }
  });

  const handleSave = () => {
    if (userName.trim()) {
      updateUserMutation.mutate(userName);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Пожалуйста, войдите в систему, чтобы просмотреть свой профиль</p>
        <button 
          onClick={() => navigate(ROUTES.LOGIN)}
          className="mt-4 btn-primary"
          style={{ backgroundColor: organization?.primaryColor }}
        >
          Log In
        </button>
      </div>
    );
  }

  // Map role to Russian text
  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back
      </button>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Профиль пользователя</h1>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center py-2"
                style={{ backgroundColor: organization?.primaryColor }}
              >
                <Edit size={18} className="mr-2" />
                Редактировать
              </button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
            <div 
              className="w-20 h-20 rounded-full text-white flex items-center justify-center text-2xl font-bold mb-4 md:mb-0 md:mr-6"
              style={{ backgroundColor: organization?.primaryColor }}
            >
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <FormField
                    label="Full Name"
                    name="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary flex items-center"
                      disabled={updateUserMutation.isPending}
                      style={{ backgroundColor: organization?.primaryColor }}
                    >
                      <Save size={18} className="mr-2" />
                      {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl md:text-2xl font-semibold">{user.name}</h2>
                  <div className="flex items-center mt-2 text-gray-600">
                    <Shield size={18} className="mr-2" />
                    <span>{getRoleText(user.role)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <Mail size={20} className="mr-3 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Почта</h3>
                  <p className="text-base md:text-lg">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <UserIcon size={20} className="mr-3 text-gray-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ФИО</h3>
                  <p className="text-base md:text-lg">{user.name}</p>
                </div>
              </div>
            </div>
            
            {user.organizationId && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <Shield size={20} className="mr-3 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Роль</h3>
                    <p className="text-base md:text-lg">{getRoleText(user.role)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;