import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">Загрузка</h2>
      <p className="text-gray-500 mt-2">Пожалуйста, подождите, пока мы подготовим ваше рабочее пространство</p>
    </div>
  );
};

export default LoadingScreen;