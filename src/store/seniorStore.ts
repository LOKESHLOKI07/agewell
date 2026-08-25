import { create } from 'zustand';
import { mockSenior } from '@/mock/seniors';
import type { Senior } from '@/types';

interface SeniorState {
  selectedSenior: Senior;
  setSelectedSenior: (senior: Senior) => void;
}

export const useSeniorStore = create<SeniorState>((set) => ({
  selectedSenior: mockSenior,
  setSelectedSenior: (selectedSenior) => set({ selectedSenior }),
}));
