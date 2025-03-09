import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCoworking, deleteCoworking } from '../../../modules/cowork/api';
import FormField from '../../../shared/components/FormField';
import FileUpload from '../../../shared/components/FileUpload';
import AddressSearch from '../../../modules/cowork/components/AddressSearch';
import LeafletMap from '../../../modules/cowork/components/LeafletMap';
import { X } from 'lucide-react';

interface CoworkingFormProps {
  id: string;
  formData: any;
  formErrors: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePhotoUpload: (file: File | null, index: number) => void;
  handleAddPhoto: () => void;
  handleRemovePhoto: (index: number) => void;
  handleRemovePhotoFile: (index: number) => void;
  handleMapClick: (coords: [number, number]) => void;
  handleAddressSelect: (address: string, coordinates: [number, number]) => void;
  organization?: { primaryColor?: string };
  onDelete: () => void;
  onSave: () => void;
}

const CoworkingForm: React.FC<CoworkingFormProps> = ({
  id,
  formData,
  formErrors,
  handleInputChange,
  handlePhotoUpload,
  handleAddPhoto,
  handleRemovePhoto,
  handleRemovePhotoFile,
  handleMapClick,
  handleAddressSelect,
  organization,
  onDelete,
  onSave
}) => {
  const queryClient = useQueryClient();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCoworking({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworking', id] });
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCoworking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coworkings'] });
      onDelete();
    },
  });

  return (
    <div className="space-y-6">
      <FormField
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        required
        error={formErrors.name}
      />
      
      <FormField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        required
        error={formErrors.description}
        as="textarea"
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
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
      
      <div className="h-64 rounded-lg overflow-hidden">
        <LeafletMap 
          coworkings={[{
            id: 'new',
            name: formData.name || 'New Coworking',
            description: formData.description || 'New coworking space',
            address: formData.address || 'Address',
            coordinates: formData.coordinates,
            geoCoordinates: formData.geoCoordinates,
            photos: [],
            organizationId: '1'
          }]} 
          onMapClick={handleMapClick}
          selectedCoworking={{
            id: 'new',
            name: formData.name || 'New Coworking',
            description: formData.description || 'New coworking space',
            address: formData.address || 'Address',
            coordinates: formData.coordinates,
            geoCoordinates: formData.geoCoordinates,
            photos: [],
            organizationId: '1'
          }}
          height="100%"
          isAdmin={true}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photos
        </label>
        {formData.photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {formData.photos.map((photo: string, index: number) => (
              <div key={index} className="relative group">
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="h-32 w-full object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No existing photos</p>
        )}
        
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add New Photos
        </label>
        {formData.photoFiles.map((_: any, index: number) => (
          <div key={`file-${index}`} className="mb-4">
            <FileUpload
              label={`Photo ${index + 1}`}
              onChange={(file) => handlePhotoUpload(file, index)}
            />
            <button
              type="button"
              onClick={() => handleRemovePhotoFile(index)}
              className="text-red-600 hover:text-red-700 text-sm flex items-center mt-1"
            >
              <X size={16} className="mr-1" />
              Remove
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
          Add Photo
        </button>
      </div>
    </div>
  );
};

export default CoworkingForm;