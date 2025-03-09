import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../modules/admin/api/organizationApi';
import { getFileUrl } from '../../modules/cowork/api/fileApi';

interface FileUploadProps {
  onChange: (file: File | null) => void;
  value?: string;
  label: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onChange, 
  value, 
  label,
  accept = "image/*" 
}) => {
  const [preview, setPreview] = useState<string | null>(value ? getFileUrl(value) : null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get organization data for accent color
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };
  
  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={accept}
      />
      
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          style={{ '--tw-hover-border-opacity': 1, borderColor: 'rgb(229 231 235)', hoverBorderColor: organization?.primaryColor } as React.CSSProperties}
        >
          <Upload size={32} className="text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Нажмите для загрузки {label.toLowerCase()}</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF до 5MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;