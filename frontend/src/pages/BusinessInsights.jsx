import React, { useState, useEffect } from 'react';
import DatasetCapabilityPanel from '../components/DatasetCapabilityPanel';
import { fetchInsights, getCompanyAnalytics } from '../services/api';
import { 
  Lightbulb, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  Briefcase, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';

const BusinessInsights = ({ customDataset }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCustom = !!customDataset;

  const loadInsights = async () => {
    setLoading(true);
    try {
      if (isCustom) {
        const companyData = await getCompanyAnalytics();
        setData(companyData);
      } else {
        const res = await fetchInsights();
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [customDataset]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Generating Data-Driven Business Insights...</p>
      </div>
    );
  }

  // Generate dynamic business insights for custom uploaded datasets
  const generateCustomInsights = () => {
    if (!data) return [];
    const insights = [];

    const salary = data.salary_analytics;
    const depts = data.department_analytics?.distribution || [];
    const roles = data.job_role_analytics?.distribution || [];
    const hires = data.hiring_trend?.trend || data.hiring_analytics?.trend || [];
    const mgrs = data.manager_analytics?.distribution || [];

    // 1. Compensation Spread Insight
    if (salary?.available) {
      const spread = salary.max_salary - salary.min_salary;
      insights.push({
        id: 'sal-1',
        title: 'Compensation Spread & Median Salary Profile',
        metric: `$${salary.avg_salary?.toLocaleString()} Mean Salary`,
        description: `Average workforce salary is $${salary.avg_salary?.toLocaleString()} (Median: $${salary.median_salary?.toLocaleString()}) with a total spread of $${spread?.toLocaleString()} between minimum ($${salary.min_salary?.toLocaleString()}) and maximum ($${salary.max_salary?.toLocaleString()}) compensation.`,
        impact: 'High Relevance',
        action: 'Benchmark compensation bands against industry standards to ensure internal equity and retention.'
      });
    }

    // 2. Department Headcount Concentration
    if (depts.length > 0) {
      const topDept = depts[0];
      insights.push({
        id: 'dept-1',
        title: `Workforce Concentration in ${topDept.Department}`,
        metric: `${topDept.percentage}% Headcount Share`,
        description: `${topDept.Department} represents the largest organizational unit with ${topDept.Count} employees (${topDept.percentage}% of total workforce).`,
        impact: topDept.percentage > 40 ? 'High Risk' : 'Medium Risk',
        action: 'Ensure department-specific leadership pipelines and resource allocation match headcount scaling.'
      });
    }

    // 3. Job Designation Distribution
    if (roles.length > 0) {
      const topRole = roles[0];
      insights.push({
        id: 'role-1',
        title: `Dominant Job Designation: ${topRole.JobRole}`,
        metric: `${topRole.Count} Employees`,
        description: `${topRole.JobRole} is the most frequent role identifier in the organization, comprising ${topRole.percentage}% of staffing.`,
        impact: 'Medium Risk',
        action: 'Define clear career progression steps and skills training for core designation roles.'
      });
    }

    // 4. Hiring Velocity Over Time
    if (hires.length > 0) {
      const totalHires = hires.reduce((acc, h) => acc + h.count, 0);
      const latest = hires[hires.length - 1];
      insights.push({
        id: 'hire-1',
        title: 'Workforce Hiring Velocity & Expansion',
        metric: `${totalHires} Total Hires Logged`,
        description: `Hiring trends spanned from ${hires[0]?.period} to ${latest?.period}, with ${latest?.count} new hires recorded in ${latest?.period}.`,
        impact: 'Positive Trend',
        action: 'Align onboarding capacity and talent acquisition workflows with annual hiring velocity.'
      });
    }

    // 5. Manager Workload Allocation
    if (mgrs.length > 0) {
      const topMgr = mgrs[0];
      insights.push({
        id: 'mgr-1',
        title: `Manager Workload Allocation (${topMgr.manager})`,
        metric: `${topMgr.count} Direct Reports`,
        description: `${topMgr.manager} manages the largest team with ${topMgr.count} reported employees.`,
        impact: topMgr.count > 8 ? 'Medium Risk' : 'Standard',
        action: 'Balance management span of control to prevent manager burnout and ensure adequate 1-on-1 employee guidance.'
      });
    }

    return insights;
  };

  const customInsights = isCustom ? generateCustomInsights() : [];
  const defaultInsights = data?.insights || [];
  const activeInsights = isCustom ? customInsights : defaultInsights;

  return (
    <div className="space-y-6">
      <DatasetCapabilityPanel customDataset={customDataset} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data-Driven Business Insights & Recommendations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated executive summary insights derived strictly from current dataset metrics.
        </p>
      </div>

      {activeInsights.length > 0 ? (
        <div className="space-y-4">
          {activeInsights.map((insight) => (
            <div key={insight.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    insight.impact?.includes('High')
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : insight.impact?.includes('Medium')
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {insight.impact}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{insight.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {insight.description}
                </p>

                <div className="pt-2 text-xs">
                  <strong className="text-blue-900 font-bold block mb-0.5">Recommended Executive Action:</strong>
                  <span className="text-slate-700 font-medium">{insight.action}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl shrink-0 text-center min-w-[140px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Key Metric</span>
                <span className="text-sm font-extrabold text-blue-700 block">{insight.metric}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
          <Lightbulb className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-xs">No Business Insights Generated</h4>
          <p className="text-[11px]">Upload a company dataset to calculate dynamic business recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default BusinessInsights;
