import { useState, useCallback } from 'react';
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
import {
  BarChart3,
  FileSpreadsheet,
  Gauge,
  Grid2x2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  PieChart,
  ReceiptText,
  Upload,
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  // Keep transactions for backwards compatibility with summary cards if needed
  const { transactions } = useTransactions();
  const { summary } = useSummary(transactions);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { records, loading: recordsLoading, error: recordsError } = useRecords(refreshTrigger);
  
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const handleImportSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('Imported Data');
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const menuItems = [
    { label: 'OVERVIEW', icon: LayoutDashboard },
    { label: 'INVOICE TOTAL', icon: ReceiptText },
    { label: 'CASH IN HAND', icon: HandCoins },
    { label: 'VARIANCE', icon: PieChart },
    { label: 'Monthly Summary', icon: BarChart3 },
    { label: 'Cost Centers', icon: Grid2x2 },
    { label: 'Forecast', icon: Gauge },
    { label: 'Imported Data', icon: FileSpreadsheet },
    { label: 'Import Excel File', icon: Upload },
  ];

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
          <div>
            <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
              Main Menu
            </p>
            <div className="space-y-1">
              {menuItems.slice(0, 7).map(({ label, icon: Icon }) => {
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

          {/* Data Management Group */}
          <div>
            <p className="px-3 mb-3 text-[11px] font-extrabold tracking-[0.2em] text-slate-500 uppercase">
              Data Management
            </p>
            <div className="space-y-1">
              {menuItems.slice(7).map(({ label, icon: Icon }) => {
                const isActive = activeTab === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTab(label)}
                    className={`group relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50 ring-1 ring-white/10'
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
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/60 bg-[#070b14]">
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-3 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm shadow-inner ring-1 ring-white/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{user?.role || 'User'}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25 ring-1 ring-red-500/20 hover:ring-red-500"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
              <span>Secure Sign Out</span>
            </button>
          </div>
        </div>
      </aside>


      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="relative z-10 overflow-hidden border-b border-slate-200 bg-white px-5 py-4 shadow-sm md:px-8">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
          <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-end">
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-4 text-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Petty Cash Control Center</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{pageTitle}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-lg font-black text-blue-700 shadow-inner">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-black text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs font-semibold text-slate-500 capitalize">{user?.role || 'User'}</p>
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
              />
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
