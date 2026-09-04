import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const FilterBar = ({ filters, options, onFilterChange, onReset }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Organizational Filters</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
          <select
            value={filters.department || 'All'}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 font-semibold"
          >
            {options?.departments?.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Job Role Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Job Role</label>
          <select
            value={filters.job_role || 'All'}
            onChange={(e) => onFilterChange('job_role', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 font-semibold"
          >
            {options?.job_roles?.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Age Group Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Age Group</label>
          <select
            value={filters.age_range || 'All'}
            onChange={(e) => onFilterChange('age_range', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 font-semibold"
          >
            {options?.age_ranges?.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
          <select
            value={filters.gender || 'All'}
            onChange={(e) => onFilterChange('gender', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 font-semibold"
          >
            {options?.genders?.map((gen) => (
              <option key={gen} value={gen}>{gen}</option>
            ))}
          </select>
        </div>

        {/* Overtime Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Overtime</label>
          <select
            value={filters.overtime || 'All'}
            onChange={(e) => onFilterChange('overtime', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 font-semibold"
          >
            {options?.overtimes?.map((ot) => (
              <option key={ot} value={ot}>{ot}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
