import { create } from "zustand";

interface LoanSheetState {
  loanId: number | null;
  open: (id: number) => void;
  close: () => void;
}

export const useLoanSheet = create<LoanSheetState>((set) => ({
  loanId: null,
  open: (id) => set({ loanId: id }),
  close: () => set({ loanId: null }),
}));
