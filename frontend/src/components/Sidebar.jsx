import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Building2, 
  UserCheck, 
  BarChart3, 
  BrainCircuit, 
  Lightbulb, 
  Info 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, hasCustomDataset }) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Dataset', icon: Upload },
    ...(hasCustomDataset ? [{ id: 'company_analytics', label: 'Company Analytics', icon: Building2, badge: 'Custom' }] : []),
    { id: 'prediction', label: 'Attrition Predictor', icon: UserCheck },
    { id: 'eda', label: 'Exploratory EDA', icon: BarChart3 },
    { id: 'metrics', label: 'Model Performance', icon: BrainCircuit },
    { id: 'insights', label: 'Business Insights', icon: Lightbulb },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 shrink-0 hidden md:block rounded-xl border border-slate-800 p-3 self-start sticky top-18 shadow-sm">
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Navigation Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xs font-bold' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
