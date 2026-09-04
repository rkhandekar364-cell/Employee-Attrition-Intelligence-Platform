import React, { useState } from 'react';
import { predictAttrition } from '../services/api';
import DatasetCapabilityPanel from '../components/DatasetCapabilityPanel';
import { 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Upload, 
  ShieldAlert, 
  Layers, 
  HelpCircle,
  Activity
} from 'lucide-react';

const Prediction = ({ customDataset, onNavigate }) => {
  const isCustom = !!customDataset;
  const hasTarget = isCustom ? customDataset.has_attrition : true;

  const [formData, setFormData] = useState({
    Age: 32,
    MonthlyIncome: 5500,
    OverTime: 'Yes',
    JobSatisfaction: 2,
    YearsAtCompany: 3,
    Department: 'Research & Development',
    JobRole: 'Research Scientist',
    Gender: 'Male',
    DistanceFromHome: 12,
    WorkLifeBalance: 2,
    StockOptionLevel: 0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictAttrition(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError('Prediction API request failed. Please check backend status at http://127.0.0.1:8000.');
    } finally {
      setLoading(false);
    }
  };

  // If Attrition target is NOT detected (e.g. custom dataset without target column)
  if (!hasTarget) {
    const detectedCols = customDataset?.preview_data?.[0] ? Object.keys(customDataset.preview_data[0]) : [];

    return (
      <div className="space-y-6">
        <DatasetCapabilityPanel customDataset={customDataset} />

        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Attrition Prediction Unavailable
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
              Your uploaded dataset <strong className="text-slate-900">({customDataset?.dataset_name})</strong> does not contain a historical employee turnover target column (e.g. <code>Attrition</code>, <code>Left</code>, <code>Exited</code>, or <code>Resigned</code>).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Dataset Diagnostic Inspection</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Detected Columns ({detectedCols.length})</span>
                <span className="font-mono text-slate-700 block mt-0.5 truncate">
                  {detectedCols.join(', ') || 'No columns'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider">Missing Required Target</span>
                <span className="font-semibold text-rose-600 block mt-0.5">
                  Historical Turnover Flag (0/1 or Yes/No)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('company_analytics')}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>View Dataset Analytics</span>
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Another Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Attrition Target Present (IBM HR or Custom with Target)
  return (
    <div className="space-y-6">
      <DatasetCapabilityPanel customDataset={customDataset} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Individual Employee Attrition Predictor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Predict individual turnover risk probability and receive machine learning retention recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prediction Input Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Employee Demographic & Role Inputs</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Employee Age</label>
                <input
                  type="number"
                  name="Age"
                  value={formData.Age}
                  onChange={handleChange}
                  min={18}
                  max={75}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monthly Income ($)</label>
                <input
                  type="number"
                  name="MonthlyIncome"
                  value={formData.MonthlyIncome}
                  onChange={handleChange}
                  min={1000}
                  max={50000}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Overtime Status</label>
                <select
                  name="OverTime"
                  value={formData.OverTime}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Yes">Yes (Mandatory Overtime)</option>
                  <option value="No">No Overtime</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Job Satisfaction (1 - 4)</label>
                <select
                  name="JobSatisfaction"
                  value={formData.JobSatisfaction}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value={1}>1 - Low Satisfaction</option>
                  <option value={2}>2 - Medium Satisfaction</option>
                  <option value={3}>3 - High Satisfaction</option>
                  <option value={4}>4 - Very High Satisfaction</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Years at Company</label>
                <input
                  type="number"
                  name="YearsAtCompany"
                  value={formData.YearsAtCompany}
                  onChange={handleChange}
                  min={0}
                  max={40}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Department</label>
                <select
                  name="Department"
                  value={formData.Department}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Research & Development">Research & Development</option>
                  <option value="Sales">Sales</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Machine Learning Risk...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Run Predictive Attrition Risk Model</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prediction Results</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                  result.risk_level === 'High Risk' 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : result.risk_level === 'Medium Risk'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {result.risk_level}
                </span>
              </div>

              <div className="text-center py-2 space-y-1">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {(result.attrition_probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Calculated Attrition Risk Probability
                </div>
              </div>

              {result.risk_factors?.length > 0 && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block">Top Contributing Risk Factors:</span>
                  <ul className="space-y-1 pl-4 list-disc text-slate-700 text-[11px]">
                    {result.risk_factors.map((rf, idx) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="space-y-2 bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
                  <span className="font-bold text-blue-950 block">HR Retention Interventions:</span>
                  <ul className="space-y-1 pl-4 list-disc text-blue-900 text-[11px]">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-xs">Awaiting Employee Inputs</h4>
              <p className="text-[11px]">Fill in employee profile metrics on the left and submit to generate risk predictions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
