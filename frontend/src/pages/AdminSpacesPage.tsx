import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, X, QrCode } from 'lucide-react';
import { getPlaces, getSpaceById, createPlace, updatePlace, deletePlace, getCoworkings } from '../modules/cowork/api';
import { Space, Coworking } from '../modules/cowork/types';
import FileUpload from '../shared/components/FileUpload';
import BottomSheet from '../shared/components/BottomSheet';
import Modal from '../shared/components/Modal';
import FormField from '../shared/components/FormField';
import QRCodeScanner from '../shared/components/QRCodeScanner';

const AdminSpacesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const queryClient = useQueryClient();

  const initialFormState = {
    name: '',
    description: '',
    photo: '',
    photoFile: null as File | null,
    floor: undefined as number | undefined,
    coworkingId: '',
    status: 'available' as const,
  };

  const [formData, setFormData] = useState(initialFormState);

  const { data: spaces = [], isLoading: isLoadingSpaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => getPlaces(),
  });

  const { data: coworkings = [], isLoading: isLoadingCoworkings } = useQuery({
    queryKey: ['coworkings'],
    queryFn: getCoworkings,
  });

  const createMutation = useMutation({
    mutationFn: createPlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setIsModalOpen(false);
      setFormData(initialFormState);
      setFormErrors({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Space> & { photoFile?: File | null } }) => 
      updatePlace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setIsModalOpen(false);
      setEditingSpace(null);
      setFormData(initialFormState);
      setFormErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setIsBottomSheetOpen(false);
    },
  });

  const handleOpenModal = (space?: Space) => {
    if (space) {
      setEditingSpace(space);
      setFormData({
        name: space.name,
        description: space.description,
        photo: space.photo,
        photoFile: null,
        floor: space.floor,
        coworkingId: space.coworkingId,
        status: space.status,
      });
    } else {
      setEditingSpace(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSpace(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, floor: value }));
  };

  const handlePhotoChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, photoFile: file }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.coworkingId) {
      errors.coworkingId = 'Coworking space is required';
    }
    
    if (!formData.photo && !formData.photoFile) {
      errors.photo = 'Photo is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (editingSpace) {
      updateMutation.mutate({
        id: editingSpace.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this space?')) {
      deleteMutation.mutate(id);
    }
   };

  const getCoworkingName = (id: string): string => {
    const coworking = coworkings.find(c => c.id === id);
    return coworking ? coworking.name : 'Unknown';
  };

  const openBottomSheet = (space: Space) => {
    setEditingSpace(space);
    setIsBottomSheetOpen(true);
  };

  const handleScanResult = (result: string) => {
    console.log('QR Code scanned:', result);
    setScanResult(result);
    setIsQrScannerOpen(false);
    setShowScanSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowScanSuccess(false);
    }, 3000);
  };

  const isLoading = isLoadingSpaces || isLoadingCoworkings;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold">Spaces</h1>
        <button 
          className="btn-primary flex items-center py-2 px-3 text-sm"
          onClick={() => handleOpenModal()}
        >
          <PlusCircle size={16} className="mr-1" />
          Add Space
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="hidden md:block">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coworking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Floor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spaces.map((space) => (
                    <tr key={space.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={space.photo} 
                            alt={space.name} 
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                          <div className="text-sm font-medium text-gray-900">{space.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{getCoworkingName(space.coworkingId)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{space.floor || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          space.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {space.status === 'available' ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenModal(space)}
                          className="text-primary hover:text-primary/80 mr-4"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(space.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {spaces.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No spaces found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-3">
              {spaces.map((space) => (
                <div 
                  key={space.id} 
                  className="bg-white rounded-lg shadow-md p-3"
                  onClick={() => openBottomSheet(space)}
                >
                  <div className="flex items-center">
                    <img 
                      src={space.photo} 
                      alt={space.name} 
                      className="h-14 w-14 rounded-lg object-cover mr-3"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{space.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{getCoworkingName(space.coworkingId)}</p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          space.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {space.status === 'available' ? 'Available' : 'Occupied'}
                        </span>
                        {space.floor && (
                          <span className="ml-2 text-xs text-gray-500">
                            Floor: {space.floor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {spaces.length === 0 && (
                <div className="text-center py-8 bg-white rounded-lg shadow-md">
                  <p className="text-gray-500">No spaces found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSpace ? 'Edit Space' : 'Add Space'}
        maxWidth="max-w-md md:max-w-xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                Photo
                <span className="text-red-500 ml-1">*</span>
              </label>
              <FileUpload
                label=""
                onChange={handlePhotoChange}
                value={formData.photo}
              />
              {formErrors.photo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.photo}</p>
              )}
            </div>
            
            <FormField
              label="Coworking Space"
              name="coworkingId"
              value={formData.coworkingId}
              onChange={handleInputChange}
              required
              error={formErrors.coworkingId}
              as="select"
            >
              <option value="">Select a coworking space</option>
              {coworkings.map((coworking) => (
                <option key={coworking.id} value={coworking.id}>
                  {coworking.name}
                </option>
              ))}
            </FormField>
            
            <FormField
              label="Floor (optional)"
              name="floor"
              type="number"
              value={formData.floor === undefined ? '' : formData.floor}
              onChange={handleFloorChange}
            />
            
            <FormField
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              as="select"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
            </FormField>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingSpace
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bottom Sheet for mobile */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={editingSpace ? editingSpace.name : ''}
      >
        {editingSpace && (
          <div className="space-y-4">
            <div className="mb-4">
              <img 
                src={editingSpace.photo} 
                alt={editingSpace.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            
            <p className="text-gray-600">{editingSpace.description}</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Coworking:</p>
                <p className="font-medium">{getCoworkingName(editingSpace.coworkingId)}</p>
              </div>
              
              {editingSpace.floor && (
                <div>
                  <p className="text-sm text-gray-500">Floor:</p>
                  <p className="font-medium">{editingSpace.floor}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Status:</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  editingSpace.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {editingSpace.status === 'available' ? 'Available' : 'Occupied'}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  handleOpenModal(editingSpace);
                }}
                className="btn-primary flex-1"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setIsBottomSheetOpen(false);
                  handleDelete(editingSpace.id);
                }}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* QR Code Scanner Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <button 
          onClick={() => setIsQrScannerOpen(true)}
          className="btn-primary flex items-center justify-center rounded-full w-14 h-14 shadow-lg"
          aria-label="Scan QR Code"
        >
          <QrCode size={24} />
        </button>
      </div>

      {/* QR Code Scanner */}
      {isQrScannerOpen && (
        <QRCodeScanner 
          onScan={handleScanResult}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}

      {/* Success Toast */}
      {showScanSuccess && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center z-50 animate-fade-in-up">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">QR-код успешно отсканирован</p>
            {scanResult && (
              <p className="text-sm text-green-100">ID: {scanResult}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpacesPage;