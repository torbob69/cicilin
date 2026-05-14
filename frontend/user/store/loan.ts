import { create } from 'zustand';

interface LoanDraft {
  loan_amnt: number | null;
  loan_intent: string | null;
  tenure_months: number | null;
  result: any | null;
}

interface LoanStore {
  draft: LoanDraft;
  setAmount: (amount: number) => void;
  setIntent: (intent: string) => void;
  setTenure: (tenure: number) => void;
  setResult: (result: any) => void;
  reset: () => void;
}

const initialDraft: LoanDraft = {
  loan_amnt: null,
  loan_intent: null,
  tenure_months: null,
  result: null,
};

export const useLoanStore = create<LoanStore>((set) => ({
  draft: initialDraft,
  setAmount: (amount) => set((s) => ({ draft: { ...s.draft, loan_amnt: amount } })),
  setIntent: (intent) => set((s) => ({ draft: { ...s.draft, loan_intent: intent } })),
  setTenure: (tenure) => set((s) => ({ draft: { ...s.draft, tenure_months: tenure } })),
  setResult: (result) => set((s) => ({ draft: { ...s.draft, result } })),
  reset: () => set({ draft: initialDraft }),
}));
