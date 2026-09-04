import React, { useState, useEffect } from 'react';
import { fetchDashboardSummary } from '../services/api';
import StatCard from '../components/StatCard';
import FilterBar from '../components/FilterBar';
import { 
  Users, 
  UserMinus, 
  Percent, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, CartesianGrid
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    department: 'All',
    job_role: 'All',
    gender: 'All',
    overtime: 'All',
    age_range: 'All'
  });

  const loadData = async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchDashboardSummary(currentFilters);
      setData(summary);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to FastAPI backend. Please verify server status at http://127.0.0.1:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      department: 'All',
      job_role: 'All',
      gender: 'All',
      overtime: 'All',
      age_range: 'All'
    });
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Executive HR Analytics Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-3 text-xs">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <h3 className="font-bold">FastAPI Backend Unavailable</h3>
          <p className="mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive HR Analytics Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Workforce metric monitoring & turnover analysis across organizational dimensions.
        </p>
      </div>

      {/* Interactive Filters Bar */}
      <FilterBar
        filters={filters}
        options={data?.filter_options}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* KPI Cards Grid - Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={data?.total_employees?.toLocaleString() || 0}
          subtitle="Filtered workforce total"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Employees Left"
          value={data?.attrition_count?.toLocaleString() || 0}
          subtitle="Turnover count"
          icon={UserMinus}
          color="red"
        />
        <StatCard
          title="Attrition Rate"
          value={`${data?.attrition_rate || 0}%`}
          subtitle="Baseline ~16.1%"
          icon={Percent}
          color={data?.attrition_rate > 18 ? 'red' : 'amber'}
          trend={{ text: data?.attrition_rate > 18 ? 'High Risk' : 'Standard', isWarning: data?.attrition_rate > 18 }}
        />
        <StatCard
          title="Avg Monthly Income"
          value={`$${data?.avg_monthly_income?.toLocaleString() || 0}`}
          subtitle="Filtered mean salary"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Average Age"
          value={`${data?.avg_age || 0} Yrs`}
          subtitle="Workforce mean age"
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Row 1 Charts: Department & Overtime */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Attrition */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Department-wise Attrition Breakdown</h3>
            <p className="text-xs text-slate-500">Total workforce vs Attrition count by department</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.department_attrition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="Department" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: '#1F2937' }}
                />
                <Bar dataKey="stay" name="Retained" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="left" name="Left (Attrition)" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overtime Attrition Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Attrition by Overtime Requirement</h3>
            <p className="text-xs text-slate-500">Overtime status impact on turnover</p>
          </div>
          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.overtime_attrition}
                  dataKey="left"
                  nameKey="OverTime"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {data?.overtime_attrition?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.OverTime === 'Yes' ? '#DC2626' : '#2563EB'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                <Legend formatter={(value) => <span className="text-xs text-slate-700 font-medium">Overtime: {value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 text-center bg-slate-50 p-2 rounded border border-slate-100 font-medium">
            Mandatory overtime workers display significantly higher turnover.
          </p>
        </div>
      </div>

      {/* Row 2 Charts: Job Role, Age Group, Income Range */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Role Attrition Rate */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Job Role Attrition Rates (%)</h3>
            <p className="text-xs text-slate-500">Turnover percentage across organizational roles</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.job_role_attrition} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} />
                <YAxis type="category" dataKey="JobRole" tick={{ fill: '#64748B', fontSize: 10 }} width={120} axisLine={{ stroke: '#E2E8F0' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Attrition Rate']}
                />
                <Bar dataKey="rate" fill="#D97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Group & Income Range Summary */}
        <div className="space-y-6">
          {/* Age Group Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-0.5">Attrition by Age Group</h3>
            <p className="text-xs text-slate-500 mb-3">Turnover across age demographics</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.age_group_attrition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="AgeGroup" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="left" name="Left" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Range Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-0.5">Attrition by Monthly Income Tier</h3>
            <p className="text-xs text-slate-500 mb-3">Turnover distribution by salary tier</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.income_range_attrition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="IncomeRange" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="left" name="Left" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
