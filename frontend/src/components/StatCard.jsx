import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100'
  };

  const activeColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg border ${activeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 space-y-0.5">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</div>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400 font-medium text-[11px] truncate">{subtitle}</span>
          {trend && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              trend.isWarning ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {trend.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
