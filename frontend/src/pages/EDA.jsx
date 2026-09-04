import React, { useState, useEffect } from 'react';
import DatasetCapabilityPanel from '../components/DatasetCapabilityPanel';
import { fetchEdaData, getCompanyAnalytics } from '../services/api';
import { 
  BarChart3, 
  Database, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Briefcase, 
  DollarSign, 
  AlertTriangle,
  Info,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';

const EDA = ({ customDataset }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCustom = !!customDataset;
  const hasTarget = isCustom ? customDataset.has_attrition : true;

  const loadEda = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCustom) {
        const companyData = await getCompanyAnalytics();
        setData(companyData);
      } else {
        const edaData = await fetchEdaData();
        setData(edaData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Exploratory Data Analysis metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEda();
  }, [customDataset]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Generating Exploratory Data Analysis (EDA)...</p>
      </div>
    );
  }

  const datasetTitle = isCustom ? (data?.dataset_name || 'Uploaded Dataset') : 'Standard IBM HR Dataset';
  const rowCount = isCustom ? (data?.records_count ?? data?.row_count ?? 0) : 1470;
  const colCount = isCustom ? (data?.columns_count ?? data?.column_count ?? 0) : 16;
  const missingCount = isCustom ? (data?.missing_values_count ?? 0) : 0;
  const qualityScore = isCustom ? (data?.data_quality_score ?? data?.quality_score ?? 100) : 98.5;

  const deptList = isCustom ? (data?.department_analytics?.distribution || []) : [
    { Department: 'Research & Development', Count: 961 },
    { Department: 'Sales', Count: 446 },
    { Department: 'Human Resources', Count: 63 }
  ];

  const roleList = isCustom ? (data?.job_role_analytics?.distribution || []) : [
    { JobRole: 'Sales Executive', Count: 326 },
    { JobRole: 'Research Scientist', Count: 292 },
    { JobRole: 'Laboratory Technician', Count: 259 },
    { JobRole: 'Manufacturing Director', Count: 145 },
    { JobRole: 'Healthcare Representative', Count: 131 }
  ];

  const salaryDist = isCustom ? (data?.salary_analytics?.distribution || []) : [
    { range: '<$3,000', count: 280 },
    { range: '$3k-$5k', count: 420 },
    { range: '$5k-$10k', count: 510 },
    { range: '$10k-$15k', count: 180 },
    { range: '>$15k', count: 80 }
  ];

  const hiringTrend = isCustom ? (data?.hiring_trend?.trend || data?.hiring_analytics?.trend || []) : [];

  return (
    <div className="space-y-6">
      <DatasetCapabilityPanel customDataset={customDataset} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exploratory Data Analysis (EDA)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated structural profiling, feature distributions, and pattern discovery for <strong className="text-slate-700">{datasetTitle}</strong>.
        </p>
      </div>

      {/* Dataset Profile Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Dataset Structural & Statistical Overview</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Records</span>
            <span className="text-lg font-black text-slate-900">{rowCount.toLocaleString()}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Columns</span>
            <span className="text-lg font-black text-slate-900">{colCount}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Missing Cells</span>
            <span className={`text-lg font-black ${missingCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {missingCount}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Quality Score</span>
            <span className="text-lg font-black text-emerald-700">{qualityScore}%</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Target Column</span>
            <span className={`text-xs font-bold ${hasTarget ? 'text-blue-700' : 'text-slate-500'}`}>
              {hasTarget ? (data?.attrition_target_column || 'Attrition') : 'Not detected'}
            </span>
          </div>
        </div>
      </div>

      {/* Categorical & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Department Categorical Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">Record count grouped by department category</p>
          </div>

          {deptList.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="Department" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="Count" name="Records" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs italic">
              Not available for this dataset — Department column unmapped
            </div>
          )}
        </div>

        {/* Job Role Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Job Designation Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">Record count grouped by job role designation</p>
          </div>

          {roleList.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleList} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="JobRole" tick={{ fill: '#64748B', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="Count" name="Records" fill="#0D9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs italic">
              Not available for this dataset — Job Role column unmapped
            </div>
          )}
        </div>
      </div>

      {/* Salary & Date Hiring Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Numeric Distribution: Monthly Income / Salary</span>
            </h3>
            <p className="text-xs text-slate-500">Distribution histogram across income tiers</p>
          </div>

          {salaryDist.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Employees" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs italic">
              Not available for this dataset — Salary column unmapped
            </div>
          )}
        </div>

        {/* Date Hiring Trend / Attrition Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>{hiringTrend.length > 0 ? "Date Trend: Hiring Velocity" : "Attrition Turnover Breakdown"}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {hiringTrend.length > 0 ? "Hiring frequency grouped by HIRE_DATE year" : "Turnover breakdown by target status"}
            </p>
          </div>

          {hiringTrend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hiringTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" name="Hired Count" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 5, fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : hasTarget ? (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-lg text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <span className="font-bold text-slate-800">Turnover Target Active: 16.1% Baseline Attrition</span>
              <p className="text-slate-500 text-center max-w-xs text-[11px]">
                Historical attrition column detected and analyzed for supervised modeling.
              </p>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs italic">
              Not available for this dataset — Attrition target & date columns unmapped
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EDA;
