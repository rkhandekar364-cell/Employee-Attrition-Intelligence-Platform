import React, { useState, useEffect } from 'react';
import { getCompanyAnalytics } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  Building2, 
  Users, 
  UserMinus, 
  Percent, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  Database,
  Briefcase,
  Layers,
  FileCheck,
  DollarSign,
  BrainCircuit,
  Calendar,
  Clock,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import DatasetCapabilityPanel from '../components/DatasetCapabilityPanel';

const CompanyAnalytics = ({ onNavigateToUpload }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCompanyAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
      setError('No active dataset found or dataset failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Processing Uploaded Dataset Analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 max-w-lg mx-auto mt-8 shadow-xs">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Dataset Analyzed Yet</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please upload and analyze a custom company dataset from the Upload Dataset page to view dataset-specific analytics.
        </p>
        <button
          onClick={onNavigateToUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition inline-flex items-center space-x-2"
        >
          <Building2 className="w-4 h-4" />
          <span>Upload Dataset Now</span>
        </button>
      </div>
    );
  }

  const datasetName = data.dataset_name || data.filename || 'Uploaded Dataset';
  const recordsCount = data.records_count ?? data.row_count ?? 0;
  const columnsCount = data.columns_count ?? data.column_count ?? 0;
  const qualityScore = data.data_quality_score ?? data.quality_score ?? 0;
  const hasAttritionTarget = data.has_attrition_target ?? data.has_attrition ?? false;
  const targetColName = data.attrition_target_column || data.attrition_column || 'Not detected';
  const overallRate = data.overall_attrition_rate;
  const totalLeft = data.total_attrition_count || 0;
  const mappedSchema = data.mapped_schema || data.confirmed_mappings || {};
  const piiList = data.pii_columns_detected || data.pii_columns || [];
  const mlStatus = data.ml_readiness || {};

  const deptList = data.department_analytics?.distribution || (Array.isArray(data.department_analytics) ? data.department_analytics : []);
  const roleList = data.job_role_analytics?.distribution || (Array.isArray(data.job_role_analytics) ? data.job_role_analytics : []);
  const hiringTrendList = data.hiring_trend?.trend || data.hiring_analytics?.trend || [];
  const managerList = data.manager_analytics?.distribution || [];

  const salaryAnalytics = data.salary_analytics;
  const ageAnalytics = data.age_analytics;
  const tenureAnalytics = data.tenure_analytics;
  const kpis = data.kpi_metrics || {};

  return (
    <div className="space-y-6">
      <DatasetCapabilityPanel customDataset={data} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Company Dataset Intelligence</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{datasetName}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Analyzed {recordsCount?.toLocaleString()} records across {columnsCount} columns.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {piiList?.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PII Shielded ({piiList.length} columns)</span>
            </div>
          )}
          <button
            onClick={onNavigateToUpload}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition"
          >
            Upload Another
          </button>
        </div>
      </div>

      {/* Target Status Warning Card if missing */}
      {!hasAttritionTarget && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h3 className="font-bold">Historical Attrition Target Data Not Available</h3>
            <p className="text-amber-800 leading-relaxed">
              This uploaded dataset does not contain a historical turnover target column (e.g. Attrition, Left, Resigned).
              Workforce breakdowns and demographic metrics are calculated below. Supervised ML model training requires a target column.
            </p>
          </div>
        </div>
      )}

      {/* ML Readiness Banner Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${hasAttritionTarget ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Machine Learning Status:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${hasAttritionTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {mlStatus.status || (hasAttritionTarget ? "Ready for Modeling" : "Unavailable — Attrition target not detected")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mlStatus.message || "Historical turnover column required for supervised ML prediction algorithms."}
            </p>
          </div>
        </div>
      </div>

      {/* Workforce KPI Cards (Requirement 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={recordsCount?.toLocaleString() || 0}
          subtitle={`Across ${columnsCount} features`}
          icon={Users}
          color="blue"
        />

        {salaryAnalytics?.available && (
          <StatCard
            title="Average Salary"
            value={`$${salaryAnalytics.avg_salary?.toLocaleString() || 0}`}
            subtitle="Dataset mean compensation"
            icon={DollarSign}
            color="emerald"
          />
        )}

        {salaryAnalytics?.available && (
          <StatCard
            title="Median Salary"
            value={`$${salaryAnalytics.median_salary?.toLocaleString() || 0}`}
            subtitle="Dataset median compensation"
            icon={DollarSign}
            color="purple"
          />
        )}

        {data.department_analytics?.available && (
          <StatCard
            title="Unique Departments"
            value={data.department_analytics.unique_count || deptList.length}
            subtitle="Department categories"
            icon={Building2}
            color="amber"
          />
        )}

        {data.job_role_analytics?.available && (
          <StatCard
            title="Unique Job Roles"
            value={data.job_role_analytics.unique_count || roleList.length}
            subtitle="Job designation codes"
            icon={Briefcase}
            color="indigo"
          />
        )}
      </div>

      {/* Schema Mapping Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Column Schema Mapping Summary</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          How columns from <strong className="text-slate-700">{datasetName}</strong> map to standard platform features:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(mappedSchema || {}).map(([stdKey, colName]) => (
            <div key={stdKey} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {stdKey.replace('_', ' ')}
              </span>
              <span className={`font-semibold truncate block ${colName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                {colName || 'Not mapped'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1 Charts: Department Workforce Breakdown & Job Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workforce Breakdown (Requirement 1) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Department Workforce Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500">Headcount grouped by Department / DEPARTMENT_ID</p>
          </div>
          
          {deptList.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="Department" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="Count" name="Headcount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs p-4">
              <Building2 className="w-6 h-6 mb-2 text-slate-300" />
              <span>Department analysis unavailable</span>
            </div>
          )}
        </div>

        {/* Job Role Headcount Distribution (Requirement 2) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Job Role Headcount Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">Headcount grouped by Job Role / JOB_ID</p>
          </div>

          {roleList.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleList} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="JobRole" tick={{ fill: '#64748B', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="Count" name="Headcount" fill="#0D9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs p-4">
              <Briefcase className="w-6 h-6 mb-2 text-slate-300" />
              <span>Job Role analysis unavailable</span>
            </div>
          )}
        </div>
      </div>

      {/* Row 2 Charts: Hiring Trend & Salary Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Trend (Requirement 3) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Hiring Trend Over Time</span>
            </h3>
            <p className="text-xs text-slate-500">Employee hiring count grouped by year from HIRE_DATE</p>
          </div>

          {hiringTrendList.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hiringTrendList} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" name="Hired Count" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs p-4">
              <Calendar className="w-6 h-6 mb-2 text-slate-300" />
              <span>Hiring trend analysis unavailable (HIRE_DATE not detected)</span>
            </div>
          )}
        </div>

        {/* Salary Analytics & Distribution (Requirement 4) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Salary Analytics & Tier Distribution</span>
            </h3>
            <p className="text-xs text-slate-500">Compensation breakdown from SALARY / MonthlyIncome</p>
          </div>

          {salaryAnalytics?.available ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Average</span>
                  <span className="font-bold text-slate-900">${salaryAnalytics.avg_salary?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Median</span>
                  <span className="font-bold text-slate-900">${salaryAnalytics.median_salary?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Minimum</span>
                  <span className="font-semibold text-slate-700">${salaryAnalytics.min_salary?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Maximum</span>
                  <span className="font-semibold text-slate-700">${salaryAnalytics.max_salary?.toLocaleString()}</span>
                </div>
              </div>

              {salaryAnalytics.distribution?.length > 0 && (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaryAnalytics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="range" tick={{ fill: '#64748B', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Employees" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-xs p-4">
              <DollarSign className="w-6 h-6 mb-2 text-slate-300" />
              <span>Salary analysis unavailable</span>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Manager Distribution (Requirement 7) & Demographics if available */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Manager */}
        {managerList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>Employees by Manager (MANAGER_ID)</span>
              </h3>
              <p className="text-xs text-slate-500">Team headcount distribution by manager identifier</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managerList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="manager" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Headcount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Age & Tenure status cards if available */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Employee Age Demographic Profile</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {ageAnalytics?.available ? `${ageAnalytics.avg_age} Yrs Average` : "Age analysis unavailable"}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Company Tenure Profile</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {tenureAnalytics?.available ? `${tenureAnalytics.avg_tenure} Yrs Average` : "Tenure analysis unavailable"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalytics;
