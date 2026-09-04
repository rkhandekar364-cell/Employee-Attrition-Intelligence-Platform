import React from 'react';
import { Activity, ShieldCheck, Database } from 'lucide-react';

const Navbar = ({ customDatasetActive, datasetTitle, recordCount = 1470 }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Platform Identifier */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-none text-white">
              Employee Attrition Intelligence
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              Enterprise HR Predictive Platform
            </span>
          </div>
        </div>

        {/* Status Indicators & Active Dataset Context */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 text-slate-200 px-3 py-1 rounded-lg text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Dataset: <strong className="text-white font-bold">{datasetTitle || 'ibm_hr_dataset.csv'}</strong></span>
            <span className="text-slate-500 font-mono text-[11px]">({recordCount?.toLocaleString()} Records)</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-lg text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>FastAPI: <strong className="text-emerald-400 font-semibold">Connected</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
