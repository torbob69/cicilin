import api from "./api";

export type LoanTab = "all" | "in_review" | "closed" | "unpaid" | "rejected" | "approved";

export const loanService = {
  apply: (data: {
    loan_amnt: number;
    loan_intent: string;
    tenure_months: number;
    pin: string;
  }) => api.post("/loans/apply", data),

  list: (tab: LoanTab = "all") =>
    api.get(`/loans/?tab=${tab}`),

  getDetail: (loanId: number) => api.get(`/loans/${loanId}`),

  acceptOffer: (loanId: number, pin: string) =>
    api.post(`/loans/${loanId}/accept-offer`, { pin }),

  getRepayments: (loanId: number) =>
    api.get(`/loans/${loanId}/repayments`),

  payInstallment: (loanId: number, repaymentId: number) =>
    api.post(`/loans/${loanId}/repayments/${repaymentId}/pay`),
};
