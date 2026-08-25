import { create } from 'zustand';
import type { ServiceRequest } from '@/types';

interface ServiceRequestState {
  requests: ServiceRequest[];
  addRequest: (request: ServiceRequest) => void;
}

export const useServiceRequestStore = create<ServiceRequestState>((set) => ({
  requests: [],
  addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
}));
