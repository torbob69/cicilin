import { create } from "zustand";
import { loanService, LoanTab } from "@/services/loans";

export interface Repayment {
  id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  penalty: number;
  paid_at: string | null;
  status: string;
}

export interface Loan {
  id: number;
  loan_amnt: number;
  loan_intent: string;
  loan_grade: string;
  loan_int_rate: number;
  loan_percent_income: number;
  tenure_months: number;
  monthly_installment: number;
  ml_score: number;
  confidence: number;
  loan_status: string;
  review_status: string;
  review_note?: string;
  disbursed_at?: string;
  created_at: string;
  repayments?: Repayment[];
}

interface LoansState {
  loans: Loan[];
  activeLoan: Loan | null;
  isLoading: boolean;
  fetchLoans: (tab?: LoanTab) => Promise<void>;
  fetchLoanDetail: (id: number) => Promise<void>;
  clearActiveLoan: () => void;
}

export const useLoansStore = create<LoansState>((set) => ({
  loans: [],
  activeLoan: null,
  isLoading: false,

  fetchLoans: async (tab = "all") => {
    set({ isLoading: true });
    try {
      const res = await loanService.list(tab);
      set({ loans: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLoanDetail: async (id) => {
    set({ isLoading: true });
    try {
      const res = await loanService.getDetail(id);
      set({ activeLoan: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  clearActiveLoan: () => set({ activeLoan: null }),
}));
