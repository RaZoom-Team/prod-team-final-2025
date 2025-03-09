import React, { useState } from 'react';
import { geocodeAddress } from '../api';

interface AddressSearchProps {
  onAddressSelect: (address: string, coordinates: [number, number]) => void;
  initialAddress?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ onAddressSelect, initialAddress = '' }) => {
  const [address, setAddress] = useState(initialAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.MouseEvent | React.FormEvent) => {
    // Предотвращаем стандартное поведение события, чтобы избежать перезагрузки страницы
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Пожалуйста, введите адрес');
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const coordinates = await geocodeAddress(address);
      if (coordinates) {
        onAddressSelect(address, coordinates);
      } else {
        setError('Не удалось найти координаты для этого адреса');
      }
    } catch (err) {
      setError('Ошибка при поиске адреса');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Введите адрес..."
            className="input w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e);
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="ml-2 btn-primary py-2"
          disabled={isSearching}
        >
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AddressSearch;