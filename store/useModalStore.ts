import { create } from "zustand";
import { CVESummary } from "@/types/cve";

interface ModalState {
  isOpen: boolean;
  selectedCVE: CVESummary | null;
  openModal: (cve: CVESummary) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  selectedCVE: null,
  openModal: (cve) => set({ isOpen: true, selectedCVE: cve }),
  closeModal: () => set({ isOpen: false, selectedCVE: null }),
}));
