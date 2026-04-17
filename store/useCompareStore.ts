import { create } from 'zustand';

interface CompareState {
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  selectedIds: [],
  toggleSelection: (id) => set((state) => {
    if (state.selectedIds.includes(id)) {
      return { selectedIds: state.selectedIds.filter((i) => i !== id) };
    }
    if (state.selectedIds.length >= 2) {
      // Replace the last one or just do nothing? 
      // User said "Select two", so we'll cap it at 2.
      // Replacing the second one is often more intuitive than doing nothing.
      return { selectedIds: [state.selectedIds[0], id] };
    }
    return { selectedIds: [...state.selectedIds, id] };
  }),
  clear: () => set({ selectedIds: [] }),
}));
