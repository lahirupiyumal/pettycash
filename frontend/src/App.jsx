import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Dashboard, {
  OverviewRoute,
  InvoiceTotalRoute,
  CashInHandRoute,
  VarianceRoute,
  MonthlySummaryRoute,
  CostCentersRoute,
  ForecastRoute,
  ImportedDataRoute,
  ImportExcelFileRoute,
  AccountantDataRoute,
  AccountantImportRoute,
  AccountantDetailsRoute,
} from './pages/Dashboard';
import AdminPanel from './components/AdminPanel';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

function DashboardIndex() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'accountant') {
    return <Navigate to="/accountant-details" replace />;
  }
  return <Navigate to="/overview" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
            {/* Dynamic Index Route based on role */}
            <Route index element={<DashboardIndex />} />
            
            {/* Main Menu Routes */}
            <Route path="overview" element={<OverviewRoute />} />
            <Route path="invoice-total" element={<InvoiceTotalRoute />} />
            <Route path="cash-in-hand" element={<CashInHandRoute />} />
            <Route path="variance" element={<VarianceRoute />} />
            <Route path="monthly-summary" element={<MonthlySummaryRoute />} />
            <Route path="cost-centers" element={<CostCentersRoute />} />
            <Route path="forecast" element={<ForecastRoute />} />
            <Route path="accountant-details" element={<AccountantDetailsRoute />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Data Management Routes */}
            <Route path="imported-data" element={<ImportedDataRoute />} />
            <Route path="import-excel" element={<ImportExcelFileRoute />} />
            <Route path="accountant-data" element={<AccountantDataRoute />} />
            <Route path="accountant-import" element={<AccountantImportRoute />} />
            
            {/* Admin Panel Route */}
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
