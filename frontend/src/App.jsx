import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UploadDataset from './pages/UploadDataset';
import CompanyAnalytics from './pages/CompanyAnalytics';
import Prediction from './pages/Prediction';
import EDA from './pages/EDA';
import ModelPerformance from './pages/ModelPerformance';
import BusinessInsights from './pages/BusinessInsights';
import { fetchActiveDataset, resetDataset } from './services/api';
import { Info } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDatasetInfo, setActiveDatasetInfo] = useState(null);

  const syncActiveDataset = async () => {
    try {
      const data = await fetchActiveDataset();
      setActiveDatasetInfo(data);
    } catch (err) {
      console.error("Error fetching active dataset info:", err);
    }
  };

  useEffect(() => {
    syncActiveDataset();
  }, []);

  const handleDatasetAnalyzed = async (datasetInfo) => {
    await syncActiveDataset();
    setActiveTab('company_analytics');
  };

  const handleResetToDefault = async () => {
    try {
      const defaultInfo = await resetDataset();
      setActiveDatasetInfo(defaultInfo);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Error resetting dataset:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans">
      <Navbar 
        customDatasetActive={activeDatasetInfo?.is_custom} 
        datasetTitle={activeDatasetInfo?.dataset_name || activeDatasetInfo?.filename || 'ibm_hr_dataset.csv'} 
        recordCount={activeDatasetInfo?.row_count || activeDatasetInfo?.records_count || 1470}
        onResetDataset={handleResetToDefault}
      />

      <div className="flex flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          hasCustomDataset={activeDatasetInfo?.is_custom} 
        />

        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <Dashboard activeDatasetInfo={activeDatasetInfo} />}

          {activeTab === 'upload' && (
            <UploadDataset onDatasetAnalyzed={handleDatasetAnalyzed} />
          )}

          {activeTab === 'company_analytics' && (
            <CompanyAnalytics onNavigateToUpload={() => setActiveTab('upload')} />
          )}

          {activeTab === 'prediction' && (
            <Prediction 
              customDataset={activeDatasetInfo} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'eda' && (
            <EDA customDataset={activeDatasetInfo} />
          )}

          {activeTab === 'metrics' && (
            <ModelPerformance 
              customDataset={activeDatasetInfo} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'insights' && (
            <BusinessInsights customDataset={activeDatasetInfo} />
          )}

          {activeTab === 'about' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold flex shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">About Employee Attrition Intelligence Platform</h2>
                  <p className="text-xs text-slate-500">Enterprise ML & Data Science Solution</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This platform combines interactive executive HR dashboards, dataset automated mapping & analysis, and predictive machine learning models to help organizations detect, understand, and prevent employee turnover.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
