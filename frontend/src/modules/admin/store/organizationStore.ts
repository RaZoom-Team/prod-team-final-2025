import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
}

interface OrganizationState {
  organization: Organization;
  updateOrganization: (data: Partial<Organization>) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organization: {
        id: '1',
        name: 'CoworkHub',
        primaryColor: '#4f46e5',
      },
      updateOrganization: (data) => 
        set((state) => ({ 
          organization: { ...state.organization, ...data } 
        })),
    }),
    {
      name: 'organization-storage',
    }
  )
);