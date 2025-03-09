import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFloor, updateFloor, deleteFloor } from '../../../modules/cowork/api';
import Modal from '../../../shared/components/Modal';
import FormField from '../../../shared/components/FormField';
import FileUpload from '../../../shared/components/FileUpload';

interface FloorModalsProps {
  coworkingId: string;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isConfirmDeleteOpen: boolean;
  onCloseAddModal: () => void;
  onCloseEditModal: () => void;
  onCloseConfirmDelete: () => void;
  onAddDeleteModal: () => void
  floorFormData: {
    level: number;
    mapImage: string;
    mapImageFile: File | null;
  };
  floorFormErrors: Record<string, string>;
  handleFloorNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFloorMapImageChange: (file: File | null) => void;
  editingFloorIndex: number;
  floors: any[];
  organization?: { primaryColor?: string };
}

const FloorModals: React.FC<FloorModalsProps> = ({
  coworkingId,
  isAddModalOpen,
  isEditModalOpen,
  isConfirmDeleteOpen,
  onCloseAddModal,
  onCloseEditModal,
  onCloseConfirmDelete,
  floorFormData,
  onAddDeleteModal,
  floorFormErrors,
  handleFloorNumberChange,
  handleFloorMapImageChange,
  editingFloorIndex,
  floors,
  organization
}) => {
  const queryClient = useQueryClient();

  // Create floor mutation
  const createFloorMutation = useMutation({
    mutationFn: (data: { level: number; mapImage?: string; mapImageFile?: File | null }) => 
      createFloor(coworkingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', coworkingId] });
      onCloseAddModal();
    },
  });

  // Update floor mutation
  const updateFloorMutation = useMutation({
    mutationFn: ({ floorId, data }: { floorId: string; data: any }) => 
      updateFloor(coworkingId, floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', coworkingId] });
      onCloseEditModal();
    },
  });

  // Delete floor mutation
  const deleteFloorMutation = useMutation({
    mutationFn: (floorId: string) => deleteFloor(coworkingId, floorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors', coworkingId] });
      onCloseConfirmDelete();
      onCloseEditModal();
    },
  });

  const handleSaveFloor = () => {
    createFloorMutation.mutate(floorFormData);
  };

  const handleUpdateFloor = () => {
    if (editingFloorIndex === -1) return;
    
    updateFloorMutation.mutate({
      floorId: floors[editingFloorIndex].id,
      data: floorFormData
    });
  };

  const handleConfirmDeleteFloor = () => {
    if (editingFloorIndex === -1) return;
    deleteFloorMutation.mutate(floors[editingFloorIndex].id);
  };

  return (
    <>

      <Modal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal}
        title="Добавить этаж"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField
            label="Номер этажа"
            name="level"
            type="number"
            value={floorFormData.level}
            onChange={handleFloorNumberChange}
            required
            error={floorFormErrors.level}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              План этажа
              <span className="text-red-500 ml-1">*</span>
            </label>
            <FileUpload
              label=""
              onChange={handleFloorMapImageChange}
              value={floorFormData.mapImage}
            />
            {floorFormErrors.mapImage && (
              <p className="mt-1 text-sm text-red-600">{floorFormErrors.mapImage}</p>
            )}
          </div>
          
          {floorFormErrors.general && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {floorFormErrors.general}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              className="btn-secondary h-10"
              onClick={onCloseAddModal}
            >
              Отмена
            </button>
            <button
              className="btn-primary h-10"
              onClick={handleSaveFloor}
              disabled={createFloorMutation.isPending}
              style={{ backgroundColor: organization?.primaryColor }}
            >
              {createFloorMutation.isPending ? 'Добавление...' : 'Добавить этаж'}
            </button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={isEditModalOpen}
        onClose={onCloseEditModal}
        title="Редактировать этаж"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <FormField
            label="Номер этажа"
            name="level"
            type="number"
            value={floorFormData.level}
            onChange={handleFloorNumberChange}
            required
            error={floorFormErrors.level}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              План этажа
              <span className="text-red-500 ml-1">*</span>
            </label>
            <FileUpload
              label=""
              onChange={handleFloorMapImageChange}
              value={floorFormData.mapImage}
            />
            {floorFormErrors.mapImage && (
              <p className="mt-1 text-sm text-red-600">{floorFormErrors.mapImage}</p>
            )}
          </div>
          
          {floorFormErrors.general && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {floorFormErrors.general}
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              className="btn-danger h-10"
              onClick={onAddDeleteModal}
              disabled={deleteFloorMutation.isPending}
            >
              {deleteFloorMutation.isPending ? 'Удаление...' : 'Удалить этаж'}
            </button>
            
            <div className="flex space-x-2">
              <button
                className="btn-secondary h-10"
                onClick={onCloseEditModal}
              >
                Отмена
              </button>
              <button
                className="btn-primary h-10"
                onClick={handleUpdateFloor}
                disabled={updateFloorMutation.isPending}
                style={{ backgroundColor: organization?.primaryColor }}
              >
                {updateFloorMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={onCloseConfirmDelete}
        title="Удалить этаж"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Вы уверены, что хотите удалить этот этаж? Это действие нельзя отменить, и все места на этом этаже будут удалены.
          </p>
          
          {floorFormErrors.general && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {floorFormErrors.general}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              className="btn-secondary h-10"
              onClick={onCloseConfirmDelete}
            >
              Отмена
            </button>
            <button
              className="btn-danger h-10"
              onClick={handleConfirmDeleteFloor}
              disabled={deleteFloorMutation.isPending}
            >
              {deleteFloorMutation.isPending ? 'Удаление...' : 'Удалить этаж'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FloorModals;