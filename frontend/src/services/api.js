import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.department && filters.department !== 'All') params.append('department', filters.department);
  if (filters.job_role && filters.job_role !== 'All') params.append('job_role', filters.job_role);
  if (filters.gender && filters.gender !== 'All') params.append('gender', filters.gender);
  if (filters.overtime && filters.overtime !== 'All') params.append('overtime', filters.overtime);
  if (filters.age_range && filters.age_range !== 'All') params.append('age_range', filters.age_range);

  const response = await api.get(`/summary?${params.toString()}`);
  return response.data;
};

export const fetchEdaData = async () => {
  const response = await api.get('/eda');
  return response.data;
};

export const fetchModelMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data;
};

export const fetchInsights = async () => {
  const response = await api.get('/insights');
  return response.data;
};

export const predictAttrition = async (employeeData) => {
  const response = await api.post('/predict', employeeData);
  return response.data;
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/dataset/upload', formData, {
    headers: {
      'Content-Type': undefined
    }
  });
  return response.data;
};

export const analyzeDataset = async (file, mappings, targetColumn) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mappings', JSON.stringify(mappings || {}));
  if (targetColumn) {
    formData.append('target_column', targetColumn);
  }

  const response = await api.post('/dataset/analyze', formData, {
    headers: {
      'Content-Type': undefined
    }
  });
  return response.data;
};

export const getCompanyAnalytics = async () => {
  const response = await api.get('/dataset/company-analytics');
  return response.data;
};
