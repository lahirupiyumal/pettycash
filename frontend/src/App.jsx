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
  AuditRoute,
  CashFloatAmountRoute,
  TotalExpensesRoute,
  TotalRoute,
} from './pages/Dashboard';
import AdminPanel from './components/AdminPanel';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') {
    if (user?.role === 'accountant') {
      return <Navigate to="/accountant-details" replace />;
    }
    if (user?.role === 'department_lead') {
      return <Navigate to="/accountant-details" replace />;
    }
    return <Navigate to="/overview" replace />;
  }
  return children;
};

function DashboardIndex() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'accountant') {
    return <Navigate to="/accountant-details" replace />;
  }
  if (user?.role === 'department_lead') {
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
            <Route path="cash-float-amount" element={<CashFloatAmountRoute />} />
            <Route path="total-expenses" element={<TotalExpensesRoute />} />
            <Route path="total" element={<TotalRoute />} />
            <Route path="variance" element={<VarianceRoute />} />
            <Route path="monthly-summary" element={<MonthlySummaryRoute />} />
            <Route path="cost-centers" element={<CostCentersRoute />} />
            <Route path="forecast" element={<ForecastRoute />} />
            <Route path="accountant-details" element={<AccountantDetailsRoute />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Data Management Routes */}
            <Route path="imported-data" element={<AdminRoute><ImportedDataRoute /></AdminRoute>} />
            <Route path="import-excel" element={<AdminRoute><ImportExcelFileRoute /></AdminRoute>} />
            <Route path="accountant-data" element={<AdminRoute><AccountantDataRoute /></AdminRoute>} />
            <Route path="accountant-import" element={<AdminRoute><AccountantImportRoute /></AdminRoute>} />
            
            {/* Admin Panel Route */}
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            
            {/* Audit Route */}
            <Route path="audit" element={<AdminRoute><AuditRoute /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
