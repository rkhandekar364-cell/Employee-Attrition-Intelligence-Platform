import React, { useState, useRef } from 'react';
import { uploadDataset, analyzeDataset } from '../services/api';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Table, 
  Check, 
  Sparkles,
  Lock,
  CheckCircle2,
  Info,
  Layers,
  CheckSquare
} from 'lucide-react';

const SEMANTIC_TARGET_FIELDS = [
  { key: 'MonthlyIncome', label: 'Monthly Income / Salary', category: 'Numeric' },
  { key: 'Department', label: 'Department / Division', category: 'Categorical' },
  { key: 'JobRole', label: 'Job Role / Designation', category: 'Categorical' },
  { key: 'HireDate', label: 'Hire Date / Joining Date', category: 'Date' },
  { key: 'Age', label: 'Employee Age', category: 'Numeric' },
  { key: 'Gender', label: 'Gender / Sex', category: 'Categorical' },
  { key: 'OverTime', label: 'Overtime Status', category: 'Categorical' },
  { key: 'YearsAtCompany', label: 'Years at Company / Tenure', category: 'Numeric' },
  { key: 'JobSatisfaction', label: 'Job Satisfaction Rating', category: 'Numeric' },
  { key: 'WorkLifeBalance', label: 'Work Life Balance Rating', category: 'Numeric' },
  { key: 'EmploymentStatus', label: 'Employment Status / Job Status', category: 'Categorical' },
  { key: 'EmployeeName', label: 'Employee Name', category: 'Text' },
  { key: 'Email', label: 'Email Address', category: 'Text' },
  { key: 'Attrition', label: 'Historical Attrition Target (Yes/No)', category: 'Categorical' },
  { key: 'Unmapped', label: '-- Unmapped / Other --', category: 'Other' }
];

const UploadDataset = ({ onAnalysisComplete, onDatasetAnalyzed }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [columnMappings, setColumnMappings] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const steps = [
    'Analyzing Dataset...',
    '✓ Dataset validated',
    '✓ Dataset-dynamic column schema detected',
    '✓ Database quality score calculated',
    '✓ Central active dataset updated'
  ];

  const handleAnalyzeSubmit = async () => {
    if (!file || !analysis) return;
    setAnalyzing(true);
    setError(null);
    setCurrentStep(0);

    const callback = onDatasetAnalyzed || onAnalysisComplete;

    try {
      await new Promise(r => setTimeout(r, 200));
      setCurrentStep(1);

      await new Promise(r => setTimeout(r, 200));
      setCurrentStep(2);

      const result = await analyzeDataset(file, columnMappings, targetColumn);
      
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 200));

      setCurrentStep(4);
      await new Promise(r => setTimeout(r, 200));

      if (callback) {
        callback(result);
      }
    } catch (err) {
      console.error("Dataset analysis error:", err);
      const msg = err.response?.data?.detail || err.message || 'Dataset analysis failed. Please check the dataset and try again.';
      setError(`Dataset analysis failed. (${msg})`);
    } finally {
      setAnalyzing(false);
    }
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    const validExtensions = ['csv', 'tsv', 'xlsx', 'xls'];
    const ext = selectedFile.name ? selectedFile.name.split('.').pop().toLowerCase() : '';
    
    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file format '.${ext}'. Please upload a valid CSV (.csv) or Excel (.xlsx) file.`);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError(`File size exceeds maximum permitted limit of 25MB (Uploaded file: ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setFile(selectedFile);
    setUploading(true);
    setError(null);
    setAnalysis(null);

    try {
      const data = await uploadDataset(selectedFile);
      setAnalysis(data);
      setTargetColumn(data.detected_attrition_column || 'none');
      
      const initialMap = {};
      if (data.column_detections) {
        data.column_detections.forEach(item => {
          initialMap[item.original_column] = item.semantic_field;
        });
      } else if (data.smart_mappings) {
        Object.keys(data.smart_mappings).forEach(key => {
          const item = data.smart_mappings[key];
          if (typeof item === 'object' && item !== null && item.column) {
            initialMap[item.column] = key;
          }
        });
      }
      setColumnMappings(initialMap);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Failed to upload and validate file. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (origCol, targetField) => {
    setColumnMappings(prev => ({
      ...prev,
      [origCol]: targetField
    }));
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setTargetColumn('');
    setColumnMappings({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const dbQualityScore = analysis 
    ? (analysis.database_quality_score ?? analysis.data_quality_score ?? analysis.quality_score ?? 0)
    : 0;

  const breakdown = analysis?.quality_breakdown || {
    completeness: 100.0,
    validity: 100.0,
    duplicate_free: 100.0,
    consistency: 100.0,
    required_fields_detected: '8/8'
  };

  const columnDetections = analysis?.column_detections || (analysis?.column_names || []).map(col => ({
    original_column: col,
    detected_type: 'Text',
    semantic_field: 'Unmapped',
    semantic_label: '-- Unmapped / Other --',
    confidence_score: 0,
    confidence: 'Low',
    reason: 'Uncertain mapping — manual assignment required',
    sample_values: []
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Employee Dataset</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload a CSV or Excel dataset to evaluate Dataset Schema & Field Mapping, Database Quality Score, and workforce analytics.
        </p>
      </div>

      {/* Privacy Warning Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Privacy Protection Active:</strong> Do not upload confidential employee information to this demo application. PII fields are automatically masked.
          </span>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      {!analysis && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50/50' 
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv, .xlsx, .xls, .tsv"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 border border-blue-100">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {uploading ? "Analyzing File Structure & Database Quality Score..." : "Drag and drop your dataset here"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: CSV (.csv), Excel (.xlsx) • Max file size: 25MB
              </p>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
              >
                Browse Files
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold">Upload Error</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {analysis && (
        <div className="space-y-6">
          {/* Small Dataset Alert Banner */}
          {(analysis.is_small_dataset || analysis.row_count < 100) && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-xs text-amber-900 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Small Dataset Notice: </span>
                <span>
                  {analysis.small_dataset_message || `${analysis.row_count} records detected. Some analytics and predictive modeling may be limited.`}
                </span>
              </div>
            </div>
          )}

          {/* File Summary Card with Independent Database Quality Score Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{analysis.filename}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {analysis.row_count?.toLocaleString()} Rows • {analysis.column_count} Columns
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 px-4 rounded-xl text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Database Quality Score</span>
                  <span className="text-xl font-black text-emerald-700">{dbQualityScore}%</span>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Different File</span>
                </button>
              </div>
            </div>

            {/* Quality Score Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Database Quality Metrics</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Rows</span>
                  <span className="font-bold text-slate-900">{analysis.row_count?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Columns</span>
                  <span className="font-bold text-slate-900">{analysis.column_count}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Completeness</span>
                  <span className="font-bold text-emerald-700">{breakdown.completeness}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Validity</span>
                  <span className="font-bold text-emerald-700">{breakdown.validity}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Duplicate-free</span>
                  <span className="font-bold text-emerald-700">{breakdown.duplicate_free}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Consistency</span>
                  <span className="font-bold text-blue-700">{breakdown.consistency ?? 100}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Attrition Target Selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Historical Attrition Target Column</span>
              <span className="text-[11px] text-slate-400 font-medium">Optional for Supervised ML</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={targetColumn || 'none'}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-2 w-full sm:w-72 focus:outline-none focus:border-blue-600 font-semibold"
              >
                <option value="none">-- Historical Attrition Target Not Present --</option>
                {analysis.column_names.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              <span className="text-xs text-slate-500">
                {targetColumn && targetColumn !== 'none' 
                  ? `Selected "${targetColumn}" as historical turnover target.` 
                  : "Workforce analytics enabled without supervised attrition model training."}
              </span>
            </div>
          </div>

          {/* DATASET-DYNAMIC: Dataset Schema & Field Mapping Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Dataset Schema & Field Mapping</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Dynamic column detection based on uploaded dataset structure</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Dataset Column</th>
                    <th className="py-2.5 px-3">Detected Type</th>
                    <th className="py-2.5 px-3">Mapped Semantic Field</th>
                    <th className="py-2.5 px-3">Mapping Confidence</th>
                    <th className="py-2.5 px-3">Match Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {columnDetections.map((colItem) => {
                    const origCol = colItem.original_column;
                    const selectedTarget = columnMappings[origCol] !== undefined 
                      ? columnMappings[origCol] 
                      : colItem.semantic_field;

                    const isMapped = selectedTarget && selectedTarget !== 'Unmapped' && selectedTarget !== 'none';
                    const score = isMapped ? (colItem.confidence_score || 95) : 0;
                    const confidenceLabel = isMapped ? (colItem.confidence || 'High') : 'Low';
                    const reason = isMapped 
                      ? colItem.reason 
                      : "Uncertain mapping — manual assignment required";

                    return (
                      <tr key={origCol} className="hover:bg-slate-50/80">
                        {/* 1. Dataset Column */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{origCol}</span>
                          {colItem.sample_values?.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">
                              Ex: {colItem.sample_values.join(', ')}
                            </span>
                          )}
                        </td>

                        {/* 2. Detected Type */}
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            colItem.detected_type === 'Date' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            colItem.detected_type === 'Numeric' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            colItem.detected_type === 'Categorical' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            colItem.detected_type?.includes('PII') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {colItem.detected_type || 'Text'}
                          </span>
                        </td>

                        {/* 3. Mapped Semantic Concept */}
                        <td className="py-2.5 px-3">
                          <select
                            value={selectedTarget || 'Unmapped'}
                            onChange={(e) => handleMappingChange(origCol, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 w-60 focus:outline-none focus:border-blue-600 font-semibold"
                          >
                            {SEMANTIC_TARGET_FIELDS.map((f) => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* 4. Mapping Confidence */}
                        <td className="py-2.5 px-3">
                          {isMapped ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>✓ {score > 0 ? `${score}% • ` : ''}{confidenceLabel}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>Unmapped</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Match Reasoning */}
                        <td className="py-2.5 px-3 text-slate-600 leading-relaxed text-[11px] max-w-xs">
                          {reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Preview Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Table className="w-4 h-4 text-blue-600" />
                <span>Dataset Preview (First 15 Rows)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">15 of {analysis.row_count.toLocaleString()} rows</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                    {analysis.column_names.map((col) => (
                      <th key={col} className="py-2 px-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.preview_data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80">
                      {analysis.column_names.map((col) => (
                        <td key={col} className="py-2 px-3 whitespace-nowrap font-mono text-slate-700">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-400 font-sans italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dataset Ready Action Section */}
          <div className="bg-white border-2 border-blue-600/30 rounded-xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Dataset Ready for Analysis</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Set as central active dataset for executive dashboard & workforce analytics.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Records</span>
                  <span className="font-bold text-slate-900">{analysis.row_count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Columns</span>
                  <span className="font-bold text-slate-900">{analysis.column_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Database Quality</span>
                  <span className="font-bold text-emerald-700">{dbQualityScore}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Attrition Target</span>
                  <span className={`font-semibold ${targetColumn && targetColumn !== 'none' ? 'text-blue-700' : 'text-slate-500'}`}>
                    {targetColumn && targetColumn !== 'none' ? targetColumn : 'Not detected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-step loading progress */}
            {analyzing && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Analyzing & Normalizing Dataset...</span>
                </div>
                <div className="space-y-1 pl-6 text-xs text-blue-800">
                  {steps.slice(1, currentStep + 1).map((step, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={analyzing}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-50"
              >
                Cancel / Upload Another Dataset
              </button>
              <button
                type="button"
                onClick={handleAnalyzeSubmit}
                disabled={analyzing || !file || !analysis}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Analysis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Dataset</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default UploadDataset;
