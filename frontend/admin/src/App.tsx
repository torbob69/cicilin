import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api';
import Dashboard from './pages/Dashboard';
import KYCReview from './pages/KYCReview';
import LoanReview from './pages/LoanReview';
import Login from './pages/Login';
import Users from './pages/Users';

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/kyc" element={<RequireAuth><KYCReview /></RequireAuth>} />
        <Route path="/loans" element={<RequireAuth><LoanReview /></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
