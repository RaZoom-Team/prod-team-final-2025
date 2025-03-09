import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { registerUser, getCurrentUserFromToken } from '../modules/user/api/authApi';
import { getOrganization } from '../modules/admin/api/organizationApi';
import { ROUTES } from '../config';

interface RegisterPageProps {
  onRegisterSuccess?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get email from query params
  const searchParams = new URLSearchParams(location.search);
  const emailFromQuery = searchParams.get('email');

  const [formData, setFormData] = useState({
    email: emailFromQuery || '',
    password: '',
    name: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Fetch organization data
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUserFromToken();
        if (user) {
          if (user.role === 'admin' || user.role === 'owner') {
            navigate(ROUTES.ADMIN_DASHBOARD);
          } else {
            navigate(ROUTES.HOME);
          }
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      
      // Call the onRegisterSuccess callback if provided
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
      
      // Use window.location for a full page reload to ensure clean state
      window.location.href = ROUTES.HOME;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    registerMutation.mutate(formData);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {organization?.logo && (
            <div className="flex justify-center mb-4">
              <img 
                src={organization.logo} 
                alt="Логотип организации" 
                className="h-16 object-contain"
              />
            </div>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {organization?.name || 'CoworkHub'}
          </h2>
          <h3 className="mt-2 text-center text-xl font-bold text-gray-900">
            Создать новый аккаунт
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Или{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:text-primary/80" style={{ color: organization?.primaryColor }}>
              войдите в существующий аккаунт
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">ФИО</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="ФИО"
                value={formData.name}
                onChange={handleChange}
                style={{ 
                  '--tw-ring-color': organization?.primaryColor,
                  borderColor: error ? 'rgb(239 68 68)' : undefined
                } as React.CSSProperties}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Электронная почта</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Электронная почта"
                value={formData.email}
                onChange={handleChange}
                style={{ 
                  '--tw-ring-color': organization?.primaryColor,
                  borderColor: error ? 'rgb(239 68 68)' : undefined
                } as React.CSSProperties}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
                style={{ 
                  '--tw-ring-color': organization?.primaryColor,
                  borderColor: error ? 'rgb(239 68 68)' : undefined
                } as React.CSSProperties}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={registerMutation.isPending}
              style={{ backgroundColor: organization?.primaryColor }}
            >
              {registerMutation.isPending ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;