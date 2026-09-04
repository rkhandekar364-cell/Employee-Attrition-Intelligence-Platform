import io
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

PII_KEYWORDS = [
    'first_name', 'firstname', 'fname', 'first name',
    'last_name', 'lastname', 'lname', 'last name',
    'email', 'e-mail', 'mail',
    'phone', 'mobile', 'cell', 'telephone', 'phone_number',
    'ssn', 'social_security', 'national_id',
    'address', 'street', 'personal_email'
]

STANDARD_FIELD_DEFINITIONS = {
    "MonthlyIncome": ["salary", "monthlyincome", "income", "compensation", "monthly_income", "base_pay", "pay"],
    "Department": ["department", "dept", "department_id", "dept_id", "division", "business_unit"],
    "JobRole": ["jobrole", "job_role", "job_id", "role", "designation", "title", "position"],
    "Age": ["age", "employee_age", "birth_date", "dob"],
    "YearsAtCompany": ["yearsatcompany", "tenure", "years_at_company", "length_of_service", "service_years"],
    "JobSatisfaction": ["jobsatisfaction", "job_satisfaction", "satisfaction_score", "satisfaction"],
    "WorkLifeBalance": ["worklifebalance", "work_life_balance", "wlb_score"],
    "OverTime": ["overtime", "over_time", "ot"],
    "HireDate": ["hiredate", "hire_date", "date_of_joining", "doj", "joined_date"],
    "ManagerID": ["managerid", "manager_id", "supervisor_id", "reports_to"]
}

CURRENT_COMPANY_DATASET_ANALYSIS: Dict[str, Any] = {}

def is_pii_column(col_name: str) -> bool:
    clean = str(col_name).strip().lower()
    return any(pii in clean for pii in PII_KEYWORDS)

def try_clean_numeric(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return series
    cleaned = series.astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).str.strip()
    return pd.to_numeric(cleaned, errors='coerce')

def evaluate_smart_mapping(columns: List[str]) -> Dict[str, str]:
    smart_mappings = {}
    used_cols = set()

    for std_field, aliases in STANDARD_FIELD_DEFINITIONS.items():
        for col in columns:
            if col in used_cols:
                continue
            clean_col = str(col).strip().lower().replace('_', '').replace(' ', '')
            if clean_col in [a.replace('_', '').replace(' ', '') for a in aliases]:
                smart_mappings[std_field] = col
                used_cols.add(col)
                break
    return smart_mappings

def analyze_uploaded_dataset(file_contents: bytes, filename: str) -> Dict[str, Any]:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if ext in ['csv', 'tsv']:
        try:
            df = pd.read_csv(io.BytesIO(file_contents))
        except Exception:
            df = pd.read_csv(io.BytesIO(file_contents), encoding='latin-1')
    else:
        df = pd.read_excel(io.BytesIO(file_contents))

    row_count = int(len(df))
    column_count = int(df.shape[1])
    total_cells = row_count * column_count
    missing_cells = int(df.isnull().sum().sum())
    dup_rows = int(df.duplicated().sum())

    completeness = max(0.0, 100.0 - (missing_cells / total_cells * 100.0)) if total_cells > 0 else 100.0
    uniqueness = max(0.0, 100.0 - (dup_rows / row_count * 100.0)) if row_count > 0 else 100.0
    data_quality_score = round(0.7 * completeness + 0.3 * uniqueness, 1)

    columns_info = []
    pii_cols = []
    detected_attrition_col = None

    for c in df.columns:
        col_str = str(c)
        is_pii = is_pii_column(col_str)
        if is_pii:
            pii_cols.append(col_str)
        
        dtype_str = str(df[c].dtype)
        col_lower = col_str.lower()
        if not detected_attrition_col and col_lower in ['attrition', 'left', 'exited', 'turnover', 'is_attrited']:
            detected_attrition_col = col_str

        columns_info.append({
            "name": col_str,
            "data_type": dtype_str,
            "is_pii": is_pii,
            "sample_values": [str(v) for v in df[c].dropna().head(3).tolist()]
        })

    smart_mappings = evaluate_smart_mapping([str(c) for c in df.columns])
    missing_required = [field for field in STANDARD_FIELD_DEFINITIONS.keys() if field not in smart_mappings]

    preview_df = df.head(10).copy()
    for p_col in pii_cols:
        if p_col in preview_df.columns:
            preview_df[p_col] = "***MASKED***"
    preview_records = preview_df.fillna("").to_dict(orient='records')

    return {
        "filename": filename,
        "row_count": row_count,
        "column_count": column_count,
        "data_quality_score": data_quality_score,
        "detected_attrition_column": detected_attrition_col,
        "smart_mappings": smart_mappings,
        "missing_required_fields": missing_required,
        "columns_info": columns_info,
        "preview_data": preview_records,
        "column_names": [str(c) for c in df.columns]
    }

def get_current_company_analytics() -> Dict[str, Any]:
    return CURRENT_COMPANY_DATASET_ANALYSIS

def analyze_custom_dataset(df: pd.DataFrame, column_mappings: Dict[str, Optional[str]], target_column: Optional[str] = None, filename: str = "Uploaded_Dataset.csv") -> Dict[str, Any]:
    global CURRENT_COMPANY_DATASET_ANALYSIS

    row_count = int(len(df))
    column_count = int(df.shape[1])
    pii_columns = [str(c) for c in df.columns if is_pii_column(str(c))]

    total_cells = row_count * column_count
    missing_cells = int(df.isnull().sum().sum())
    dup_rows = int(df.duplicated().sum())
    completeness = max(0.0, 100.0 - (missing_cells / total_cells * 100.0)) if total_cells > 0 else 100.0
    uniqueness = max(0.0, 100.0 - (dup_rows / row_count * 100.0)) if row_count > 0 else 100.0
    quality_score = round(0.7 * completeness + 0.3 * uniqueness, 1)

    has_attrition = False
    attrition_col_name = None
    attrition_stats = None

    if target_column and str(target_column) in df.columns and str(target_column) != 'none':
        non_null_target = df[target_column].dropna()
        if not non_null_target.empty:
            has_attrition = True
            attrition_col_name = str(target_column)
            val_counts = non_null_target.astype(str).value_counts().to_dict()
            attrition_stats = {
                "column_name": attrition_col_name,
                "value_counts": {str(k): int(v) for k, v in val_counts.items()}
            }

    valid_mappings = {}
    for k, v in column_mappings.items():
        if v and str(v) in df.columns and str(v) != 'none':
            valid_mappings[k] = str(v)
        else:
            valid_mappings[k] = None

    salary_data = None
    salary_col = valid_mappings.get('MonthlyIncome')
    if salary_col and salary_col not in pii_columns:
        s_series = try_clean_numeric(df[salary_col]).dropna()
        if not s_series.empty:
            avg_salary = round(float(s_series.mean()), 2)
            min_salary = round(float(s_series.min()), 2)
            max_salary = round(float(s_series.max()), 2)
            median_salary = round(float(s_series.median()), 2)

            bins = [0, 3000, 5000, 10000, 15000, float('inf')]
            labels = ['<$3,000', '$3,000-$5,000', '$5,000-$10,000', '$10,000-$15,000', '>$15,000']
            binned = pd.cut(s_series, bins=bins, labels=labels, right=False)
            dist_counts = binned.value_counts().to_dict()
            salary_dist = [{"range": str(k), "count": int(v)} for k, v in dist_counts.items()]

            salary_data = {
                "available": True,
                "mapped_column": salary_col,
                "avg_salary": avg_salary,
                "min_salary": min_salary,
                "max_salary": max_salary,
                "median_salary": median_salary,
                "distribution": salary_dist
            }

    if not salary_data:
        salary_data = {"available": False, "mapped_column": salary_col, "reason": "Salary / Monthly Income column not mapped or non-numeric"}

    dept_data = None
    dept_col = valid_mappings.get('Department')
    if dept_col and dept_col not in pii_columns:
        d_series = df[dept_col].dropna().astype(str)
        if not d_series.empty:
            d_counts = d_series.value_counts().head(10).to_dict()
            dept_dist = [{"department": f"Department {k}" if k.isdigit() else str(k), "count": int(v), "percentage": round((int(v)/row_count)*100, 1)} for k, v in d_counts.items()]
            dept_data = {
                "available": True,
                "mapped_column": dept_col,
                "distribution": dept_dist
            }
    if not dept_data:
        dept_data = {"available": False, "mapped_column": dept_col, "reason": "Department column not mapped"}

    role_data = None
    role_col = valid_mappings.get('JobRole')
    if role_col and role_col not in pii_columns:
        r_series = df[role_col].dropna().astype(str)
        if not r_series.empty:
            r_counts = r_series.value_counts().head(10).to_dict()
            role_dist = [{"role": str(k), "count": int(v), "percentage": round((int(v)/row_count)*100, 1)} for k, v in r_counts.items()]
            role_data = {
                "available": True,
                "mapped_column": role_col,
                "distribution": role_dist
            }
    if not role_data:
        role_data = {"available": False, "mapped_column": role_col, "reason": "Job Role column not mapped"}

    age_data = None
    age_col = valid_mappings.get('Age')
    if age_col and age_col not in pii_columns:
        a_series = try_clean_numeric(df[age_col]).dropna()
        if not a_series.empty:
            avg_age = round(float(a_series.mean()), 1)
            min_age = int(a_series.min())
            max_age = int(a_series.max())

            bins = [0, 25, 35, 45, 55, float('inf')]
            labels = ['Under 25', '25-34', '35-44', '45-54', '55+']
            binned = pd.cut(a_series, bins=bins, labels=labels, right=False)
            dist_counts = binned.value_counts().to_dict()
            age_dist = [{"range": str(k), "count": int(v)} for k, v in dist_counts.items()]

            age_data = {
                "available": True,
                "mapped_column": age_col,
                "avg_age": avg_age,
                "min_age": min_age,
                "max_age": max_age,
                "distribution": age_dist
            }
    if not age_data:
        age_data = {"available": False, "mapped_column": age_col, "reason": "Employee Age column not mapped"}

    tenure_data = None
    tenure_col = valid_mappings.get('YearsAtCompany')
    if tenure_col and tenure_col not in pii_columns:
        t_series = try_clean_numeric(df[tenure_col]).dropna()
        if not t_series.empty:
            avg_tenure = round(float(t_series.mean()), 1)
            bins = [0, 3, 6, 11, float('inf')]
            labels = ['0-2 Years', '3-5 Years', '6-10 Years', '10+ Years']
            binned = pd.cut(t_series, bins=bins, labels=labels, right=False)
            dist_counts = binned.value_counts().to_dict()
            tenure_dist = [{"range": str(k), "count": int(v)} for k, v in dist_counts.items()]
            tenure_data = {
                "available": True,
                "mapped_column": tenure_col,
                "avg_tenure": avg_tenure,
                "distribution": tenure_dist
            }
    if not tenure_data:
        tenure_data = {"available": False, "mapped_column": tenure_col, "reason": "Tenure / Years at Company column not mapped"}

    hiring_trend = None
    hire_col = valid_mappings.get('HireDate')
    if hire_col and hire_col in df.columns:
        try:
            dates = pd.to_datetime(df[hire_col], errors='coerce')
            valid_dates = dates.dropna()
            if not valid_dates.empty:
                by_year = valid_dates.dt.year.value_counts().sort_index().to_dict()
                hiring_trend = [{"year": str(int(k)), "hires": int(v)} for k, v in by_year.items()]
        except Exception:
            hiring_trend = None

    manager_data = None
    mgr_col = valid_mappings.get('ManagerID')
    if mgr_col and mgr_col in df.columns:
        m_series = df[mgr_col].dropna().astype(str)
        if not m_series.empty:
            m_counts = m_series.value_counts().head(5).to_dict()
            manager_data = [{"manager": f"Manager {k}" if k.isdigit() else str(k), "direct_reports": int(v)} for k, v in m_counts.items()]

    result = {
        "filename": filename,
        "row_count": row_count,
        "column_count": column_count,
        "quality_score": quality_score,
        "has_attrition": has_attrition,
        "attrition_column": attrition_col_name,
        "attrition_stats": attrition_stats,
        "ml_readiness": {
            "status": "Ready for Modeling" if has_attrition else "Target Not Detected",
            "message": "Supervised ML modeling enabled." if has_attrition else "Add a historical Attrition/Exited/Left column to enable supervised attrition modeling."
        },
        "confirmed_mappings": valid_mappings,
        "salary_analytics": salary_data,
        "department_analytics": dept_data,
        "job_role_analytics": role_data,
        "age_analytics": age_data,
        "tenure_analytics": tenure_data,
        "hiring_trend": hiring_trend,
        "manager_analytics": manager_data,
        "pii_columns": pii_columns,
        "privacy_notice": "Privacy notice: Do not upload confidential or personally identifiable employee information to this demo application."
    }

    CURRENT_COMPANY_DATASET_ANALYSIS = result
    return result
