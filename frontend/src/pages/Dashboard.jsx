import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSummary } from '../hooks/useSummary';
import { useRecords } from '../hooks/useRecords';
import ImportExcelFile from '../components/ImportExcelFile';
import Variance from '../components/Variance';
import CashInHand from '../components/CashInHand';
import MonthlySummary from '../components/MonthlySummary';
import Overview from '../components/Overview';
import ImportedDataPage from './ImportedData';
import Forecast from '../components/Forecast';
import InvoiceTotal from '../components/InvoiceTotal';
import CostCenters from '../components/CostCenters';
import AccountantImport from './AccountantImport';
import AccountantImportedData from './AccountantImportedData';
import AccountantProgressAnalytics from './AccountantProgressAnalytics';
import Audit from './Audit';
import {
  BarChart3,
  BookUser,
  FileSpreadsheet,
  Gauge,
  Grid2x2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  PieChart,
  ReceiptText,
  Upload,
  Settings,
  UserCircle2,
  ClipboardList,
} from 'lucide-react';

// Route wrapper components to pass context props down to existing tab views
export function OverviewRoute() {
  const { records, recordsLoading, recordsError } = useOutletContext();
  if (recordsError) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>;
  }
  if (recordsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return <Overview records={records || []} />;
}

export function InvoiceTotalRoute() {
  const { summary, records, recordsError, recordsLoading } = useOutletContext();
  return (
    <InvoiceTotal
      summary={summary}
      records={records}
      recordsError={recordsError}
      recordsLoading={recordsLoading}
    />
  );
}

export function CashInHandRoute() {
  const { records, recordsLoading, recordsError } = useOutletContext();
  if (recordsError) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>;
  }
  if (recordsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return <CashInHand records={records || []} />;
}

export function VarianceRoute() {
  const { records } = useOutletContext();
  return <Variance records={records} />;
}

export function MonthlySummaryRoute() {
  const { records, recordsLoading, recordsError } = useOutletContext();
  if (recordsError) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>;
  }
  if (recordsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return <MonthlySummary records={records || []} />;
}

export function CostCentersRoute() {
  const { records, recordsError, recordsLoading } = useOutletContext();
  return (
    <CostCenters
      records={records}
      recordsError={recordsError}
      recordsLoading={recordsLoading}
    />
  );
}

export function ForecastRoute() {
  const { records, recordsLoading, recordsError } = useOutletContext();
  if (recordsError) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>;
  }
  if (recordsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return <Forecast records={records || []} />;
}

export function ImportedDataRoute() {
  const { records, recordsLoading, recordsError, handleDeleteSuccess, refreshTrigger } = useOutletContext();
  return (
    <ImportedDataPage
      records={records || []}
      loading={recordsLoading}
      error={recordsError}
      onDeleteSuccess={handleDeleteSuccess}
      refreshTrigger={refreshTrigger}
    />
  );
}

export function ImportExcelFileRoute() {
  const { handleImportSuccess } = useOutletContext();
  return <ImportExcelFile onImportSuccess={handleImportSuccess} />;
}

export function AccountantDataRoute() {
  const { refreshTrigger } = useOutletContext();
  return <AccountantImportedData refreshTrigger={refreshTrigger} />;
}

export function AccountantImportRoute() {
  const { handleAccountantImportSuccess } = useOutletContext();
  return <AccountantImport onImportSuccess={handleAccountantImportSuccess} />;
}

export function AccountantDetailsRoute() {
  const { refreshTrigger } = useOutletContext();
  return <AccountantProgressAnalytics refreshTrigger={refreshTrigger} />;
}

export function AuditRoute() {
  return <Audit />;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Keep transactions for backwards compatibility with summary cards if needed
  const { transactions } = useTransactions();
  const { summary } = useSummary(transactions);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { records, loading: recordsLoading, error: recordsError } = useRecords(refreshTrigger);

  const handleImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    navigate('/imported-data');
  }, [navigate]);

  const handleAccountantImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    navigate('/accountant-data');
  }, [navigate]);

  const handleDeleteSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAccountant = user?.role === 'accountant';

  const menuItems = useMemo(() => {
    const items = [
      { label: 'OVERVIEW', icon: LayoutDashboard, path: '/overview' },
      { label: 'INVOICE TOTAL', icon: ReceiptText, path: '/invoice-total' },
      { label: 'CASH IN HAND', icon: HandCoins, path: '/cash-in-hand' },
      { label: 'VARIANCE', icon: PieChart, path: '/variance' },
      { label: 'Monthly Summary', icon: BarChart3, path: '/monthly-summary' },
      { label: 'Cost Centers', icon: Grid2x2, path: '/cost-centers' },
      { label: 'Forecast', icon: Gauge, path: '/forecast' },
      { label: 'Accountant Details', icon: BookUser, path: '/accountant-details' },
      { label: 'Imported Data', icon: FileSpreadsheet, path: '/imported-data' },
      { label: 'Import Excel File', icon: Upload, path: '/import-excel' },
      { label: 'Accountant Data', icon: FileSpreadsheet, path: '/accountant-data' },
      { label: 'Accountant Import', icon: Upload, path: '/accountant-import' },
    ];

    if (isAdmin) {
      items.push({ label: 'ADMIN PANEL', icon: Settings, path: '/admin' });
      items.push({ label: 'AUDIT', icon: ClipboardList, path: '/audit' });
    }

    items.push({ label: 'User Profile', icon: UserCircle2, path: '/profile' });

    return items;
  }, [isAdmin]);

  // Accountant-specific menu items
  const accountantMenuItems = useMemo(() => {
    if (!isAccountant) {
      return [];
    }
    return menuItems.filter(item => [
      'Accountant Details',
      'Accountant Data',
      'Accountant Import'
    ].includes(item.label));
  }, [isAccountant, menuItems]);

  const mainMenuItems = useMemo(() => {
    if (isAdmin || isAccountant) {
      return [];
    }

    return menuItems.filter(item => ['OVERVIEW', 'INVOICE TOTAL', 'CASH IN HAND', 'VARIANCE', 'Monthly Summary', 'Cost Centers', 'Forecast'].includes(item.label));
  }, [isAdmin, isAccountant, menuItems]);

  const dataManagementItems = useMemo(() => {
    if (isAdmin || isAccountant) {
      return [];
    }

    return menuItems.filter(item => ['Imported Data', 'Import Excel File'].includes(item.label));
  }, [isAdmin, isAccountant, menuItems]);

  const profileItems = useMemo(() => {
    if (isAdmin || isAccountant) {
      return [];
    }

    return menuItems.filter(item => item.label === 'User Profile');
  }, [isAdmin, isAccountant, menuItems]);

  // Accountant profile section (separate from regular users)
  const accountantProfileItems = useMemo(() => {
    if (!isAccountant) {
      return [];
    }
    return menuItems.filter(item => item.label === 'User Profile');
  }, [isAccountant, menuItems]);

  const adminItems = useMemo(() => {
    if (isAdmin) {
      return [
        { label: 'ADMIN PANEL', icon: Settings, path: '/admin' },
        { label: 'AUDIT', icon: ClipboardList, path: '/audit' },
      ];
    }

    return menuItems.filter(item => item.label === 'ADMIN PANEL' || item.label === 'AUDIT');
  }, [isAdmin, menuItems]);

  const currentMenuItem = useMemo(() => {
    return menuItems.find(item =>
      item.path === location.pathname || (item.path === '/overview' && location.pathname === '/')
    );
  }, [menuItems, location.pathname]);

  const pageTitle = currentMenuItem ? currentMenuItem.label : (isAdmin ? 'ADMIN PANEL' : 'Dashboard');

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside className="hidden lg:flex w-[280px] bg-[#0a0f1c] text-slate-300 flex-col shadow-2xl border-r border-slate-800/60 relative z-20">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-blue-500/10 blur-[60px] pointer-events-none" />

        {/* Logo Section */}
        <div className="relative flex items-center justify-center py-8 px-6 border-b border-slate-800/60">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/ed/SLTMobitel_Logo.svg"
            alt="SLT Logo"
            className="h-16 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7 custom-scrollbar">
          {/* Main Menu Group */}
          {mainMenuItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Main Menu
              </p>
              <div className="space-y-1">
                {mainMenuItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path || (path === '/overview' && location.pathname === '/');
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accountant Menu Group - Shows only for accountants */}
          {accountantMenuItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Main Menu
              </p>
              <div className="space-y-1">
                {accountantMenuItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Management Group */}
          {dataManagementItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Data Management
              </p>
              <div className="space-y-1">
                {dataManagementItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path || (path === '/overview' && location.pathname === '/');
                  const isAcc = label.includes('Accountant');
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? isAcc
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/50 ring-1 ring-white/10'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile section for regular users */}
          {profileItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Account
              </p>
              <div className="space-y-1">
                {profileItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/40 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accountant Profile Section */}
          {accountantProfileItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Account
              </p>
              <div className="space-y-1">
                {accountantProfileItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/40 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Administration
              </p>
              <div className="space-y-1">
                {adminItems.map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path || (path === '/overview' && location.pathname === '/');
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${isActive
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/60">
            <button
              onClick={logout}
              className="group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 shadow-sm hover:shadow-md"
            >
              <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
              <span className="flex-1 text-left tracking-wide">Logout</span>
            </button>
          </div>
        </nav>
      </aside>


      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="relative z-10 border-b border-slate-100 bg-white px-5 py-3 md:px-8">
          <div className="relative flex items-center justify-between gap-4">
            {/* Center: Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-0.5">Dashboard</p>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
            </div>

            {/* Right: User Profile */}
            <div className="ml-auto flex items-center flex-shrink-0">
              {/* User Profile Card - Compact */}
              <Link to="/profile" className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                {/* Avatar */}
                <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-sm shadow-md text-white ${user?.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                {/* User Info */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{user?.role || 'User'}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {!isAdmin && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {/* Mobile navigation items based on role */}
              {(isAccountant ? accountantMenuItems.concat(accountantProfileItems) : 
                mainMenuItems.concat(dataManagementItems).concat(profileItems))
                .map(({ label, path }) => {
                  const isActive = location.pathname === path || (path === '/overview' && location.pathname === '/');
                  return (
                    <Link
                      key={label}
                      to={path}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border ${isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200'
                        }`}
                    >
                      {label}
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        <main className="flex-1 px-5 py-4 md:px-8 md:py-5 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f1f5f9_32%,#f8fafc_100%)]">
          <div className="max-w-7xl mx-auto">
            <Outlet
              context={{
                summary,
                records,
                recordsLoading,
                recordsError,
                refreshTrigger,
                handleImportSuccess,
                handleAccountantImportSuccess,
                handleDeleteSuccess,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
