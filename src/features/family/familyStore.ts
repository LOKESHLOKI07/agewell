import { create } from 'zustand';

interface FamilyState {
  selectedSeniorId: string | null;
  selectSenior: (seniorId: string | null) => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  selectedSeniorId: null,
  selectSenior: (seniorId) => set({ selectedSeniorId: seniorId }),
  reset: () => set({ selectedSeniorId: null }),
}));
