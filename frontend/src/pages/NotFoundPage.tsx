import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">Страница не найдена</h2>
        <p className="mt-2 text-gray-600">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="btn-primary"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;