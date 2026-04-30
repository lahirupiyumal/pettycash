import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSummary } from '../hooks/useSummary';
import { useRecords } from '../hooks/useRecords';
import SummaryCards from '../components/SummaryCards';
import RecordTable from '../components/RecordTable';
import ExcelImportForm from '../components/ExcelImportForm';
import VarianceDashboard from '../components/VarianceDashboard';
import CashInHandChart from '../components/CashInHandChart';
import MonthlySummaryTable from '../components/MonthlySummaryTable';
import OverviewDashboard from '../components/OverviewDashboard';
import ImportedDataPage from './ImportedData';
import ForecastCharts from '../components/ForecastCharts';
import {
  BarChart3,
  FileSpreadsheet,
  Gauge,
  HandCoins,
  LayoutDashboard,
  LogOut,
  PieChart,
  ReceiptText,
  Upload,
  WalletCards,
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
    { label: 'Cost Centers', icon: WalletCards },
    { label: 'Forecast', icon: Gauge },
    { label: 'Imported Data', icon: FileSpreadsheet },
    { label: 'Import Excel File', icon: Upload },
  ];

  const pageTitle = activeTab === 'OVERVIEW' ? 'Dashboard Overview' : activeTab;

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside className="hidden lg:flex w-72 bg-slate-950 text-white flex-col shadow-xl">
        <div className="px-7 py-7 border-b border-white/10 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-950/20">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Finance Portal</p>
              <h2 className="text-2xl font-black tracking-tight">Petty Cash</h2>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-3 text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">Navigation</p>
          {menuItems.map(({ label, icon: Icon }) => (
            <button 
              key={label} 
              onClick={() => setActiveTab(label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeTab === label
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950/20' 
                  : 'text-slate-300 border-transparent hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex flex-1 items-center justify-between">
                {label}
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    activeTab === label ? 'bg-orange-300' : 'bg-slate-700'
                  }`}
                ></span>
              </span>
            </button>
          ))}
        </nav>

        <div className="px-4 pb-5 pt-3 mt-auto border-t border-white/10 bg-slate-950">
          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-8 py-4 flex flex-wrap gap-4 justify-between items-center z-10 shadow-sm">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase">Petty Cash Control Center</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
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

        <main className="flex-1 p-5 md:p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f1f5f9_32%,#f8fafc_100%)]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'Import Excel File' ? (
              <ExcelImportForm onImportSuccess={handleImportSuccess} />
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
                <ForecastCharts records={records || []} />
              )
            ) : activeTab === 'OVERVIEW' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <OverviewDashboard records={records || []} />
              )
            ) : activeTab === 'CASH IN HAND' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <CashInHandChart records={records || []} />
              )
            ) : activeTab === 'Monthly Summary' ? (
              recordsError ? (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>
              ) : recordsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <MonthlySummaryTable records={records || []} />
              )
            ) : activeTab === 'VARIANCE' ? (
              <VarianceDashboard records={records} />
            ) : (
              <>
                <SummaryCards summary={summary} />
                
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Regional Petty Cash Records</h3>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">{records?.length || 0} Records</span>
                  </div>
                  <div className="p-0">
                    {recordsError && <p className="text-red-500 text-sm m-6 bg-red-50 p-3 rounded">{recordsError}</p>}
                    {recordsLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <RecordTable records={records} />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
