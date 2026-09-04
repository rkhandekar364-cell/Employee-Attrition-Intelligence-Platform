import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Database, 
  BarChart2, 
  DollarSign, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  UserCheck, 
  BrainCircuit 
} from 'lucide-react';

const DatasetCapabilityPanel = ({ customDataset }) => {
  const isCustom = !!customDataset;
  const hasTarget = isCustom ? customDataset.has_attrition : true;
  const hasSalary = isCustom ? customDataset.salary_analytics?.available : true;
  const hasDept = isCustom ? customDataset.department_analytics?.available : true;
  const hasRole = isCustom ? customDataset.job_role_analytics?.available : true;
  const hasHiring = isCustom ? (customDataset.hiring_trend?.available || customDataset.hiring_analytics?.available) : false;

  const capabilities = [
    { label: 'General EDA', available: true, icon: BarChart2 },
    { label: 'Salary Analytics', available: hasSalary, icon: DollarSign },
    { label: 'Department Analytics', available: hasDept, icon: Building2 },
    { label: 'Job Role Analytics', available: hasRole, icon: Briefcase },
    { label: 'Hiring Trend', available: hasHiring, icon: TrendingUp },
    { label: 'Attrition Prediction', available: hasTarget, icon: UserCheck, isML: true },
    { label: 'ML Model Performance', available: hasTarget, icon: BrainCircuit, isML: true },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Dataset Capability Matrix & Analytical Features</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          Source: <strong className="text-slate-700">{isCustom ? customDataset.dataset_name : 'Standard IBM HR Dataset'}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <div 
              key={cap.label}
              className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition ${
                cap.available 
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-3.5 h-3.5 ${cap.available ? 'text-emerald-600' : 'text-slate-400'}`} />
                {cap.available ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
              <span className="font-bold text-[11px] truncate block leading-tight">{cap.label}</span>
              <span className={`text-[9px] font-semibold uppercase tracking-wider block mt-0.5 ${
                cap.available ? 'text-emerald-700' : 'text-slate-400'
              }`}>
                {cap.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DatasetCapabilityPanel;
