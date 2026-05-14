import { useState, useCallback, useMemo } from 'react';
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
import AdminPanel from '../components/AdminPanel';
import AccountantImport from './AccountantImport';
import AccountantImportedData from './AccountantImportedData';
import AccountantDetails from './AccountantDetails';
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
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  // Keep transactions for backwards compatibility with summary cards if needed
  const { transactions } = useTransactions();
  const { summary } = useSummary(transactions);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { records, loading: recordsLoading, error: recordsError } = useRecords(refreshTrigger);
  
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'ADMIN PANEL' : 'OVERVIEW');

  const handleImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('Imported Data');
  }, []);

  const handleAccountantImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('Accountant Data');
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const menuItems = useMemo(() => {
    if (user?.role === 'admin') {
      return [{ label: 'ADMIN PANEL', icon: Settings }];
    }
    
    return [
      { label: 'OVERVIEW', icon: LayoutDashboard },
      { label: 'INVOICE TOTAL', icon: ReceiptText },
      { label: 'CASH IN HAND', icon: HandCoins },
      { label: 'VARIANCE', icon: PieChart },
      { label: 'Monthly Summary', icon: BarChart3 },
      { label: 'Cost Centers', icon: Grid2x2 },
      { label: 'Forecast', icon: Gauge },
      { label: 'Accountant Details', icon: BookUser },
      { label: 'Imported Data', icon: FileSpreadsheet },
      { label: 'Import Excel File', icon: Upload },
      { label: 'Accountant Data', icon: FileSpreadsheet },
      { label: 'Accountant Import', icon: Upload },
    ];
  }, [user?.role]);

  const pageTitle = activeTab;

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
          {menuItems.some(item => ['OVERVIEW', 'INVOICE TOTAL', 'CASH IN HAND', 'VARIANCE', 'Monthly Summary', 'Cost Centers', 'Forecast', 'Accountant Details'].includes(item.label)) && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Main Menu
              </p>
              <div className="space-y-1">
                {menuItems.filter(item => ['OVERVIEW', 'INVOICE TOTAL', 'CASH IN HAND', 'VARIANCE', 'Monthly Summary', 'Cost Centers', 'Forecast', 'Accountant Details'].includes(item.label)).map(({ label, icon: Icon }) => {
                  const isActive = activeTab === label;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTab(label)}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Management Group */}
          {menuItems.some(item => ['Imported Data', 'Import Excel File', 'Accountant Data', 'Accountant Import'].includes(item.label)) && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Data Management
              </p>
              <div className="space-y-1">
                {menuItems.filter(item => ['Imported Data', 'Import Excel File', 'Accountant Data', 'Accountant Import'].includes(item.label)).map(({ label, icon: Icon }) => {
                  const isActive = activeTab === label;
                  const isAccountant = label.includes('Accountant');
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTab(label)}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                        isActive
                          ? isAccountant 
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {menuItems.some(item => item.label === 'ADMIN PANEL') && (
            <div>
              <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
                Administration
              </p>
              <div className="space-y-1">
                {menuItems.filter(item => item.label === 'ADMIN PANEL').map(({ label, icon: Icon }) => {
                  const isActive = activeTab === label;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTab(label)}
                      className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/50 ring-1 ring-white/10'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="flex-1 text-left tracking-wide">{label}</span>
                      {isActive && (
                        <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </button>
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
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Avatar */}
                <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-sm shadow-md text-white ${
                  user?.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                {/* User Info */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {menuItems.map(({ label }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                  activeTab === label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 px-5 py-4 md:px-8 md:py-5 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f1f5f9_32%,#f8fafc_100%)]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'Import Excel File' ? (
              <ImportExcelFile onImportSuccess={handleImportSuccess} />
            ) : activeTab === 'Imported Data' ? (
              <ImportedDataPage
                records={records || []}
                loading={recordsLoading}
                error={recordsError}
                onDeleteSuccess={handleDeleteSuccess}
                refreshTrigger={refreshTrigger}
              />
            ) : activeTab === 'Accountant Import' ? (
              <AccountantImport onImportSuccess={handleAccountantImportSuccess} />
            ) : activeTab === 'Accountant Data' ? (
              <AccountantImportedData refreshTrigger={refreshTrigger} />
            ) : activeTab === 'Accountant Details' ? (
              <AccountantDetails />
            ) : activeTab === 'Forecast' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Forecast records={records || []} />
              )
            ) : activeTab === 'OVERVIEW' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Overview records={records || []} />
              )
            ) : activeTab === 'CASH IN HAND' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <CashInHand records={records || []} />
              )
            ) : activeTab === 'Monthly Summary' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <MonthlySummary records={records || []} />
              )
            ) : activeTab === 'VARIANCE' ? (
              <Variance records={records} />
            ) : activeTab === 'Cost Centers' ? (
              <CostCenters
                records={records}
                recordsError={recordsError}
                recordsLoading={recordsLoading}
              />
            ) : activeTab === 'ADMIN PANEL' ? (
              <AdminPanel />
            ) : (
              <InvoiceTotal
                summary={summary}
                records={records}
                recordsError={recordsError}
                recordsLoading={recordsLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
