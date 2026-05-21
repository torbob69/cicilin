import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAdminStore } from './store/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import KYCReview from './pages/KYCReview'
import LoanReview from './pages/LoanReview'
import Users from './pages/Users'
import DevGodMode from './pages/DevGodMode'
import Sidebar from './components/Sidebar'

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAdminStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/kyc" element={<Protected><KYCReview /></Protected>} />
        <Route path="/loans" element={<Protected><LoanReview /></Protected>} />
        <Route path="/users" element={<Protected><Users /></Protected>} />
        <Route path="/dev" element={<Protected><DevGodMode /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
