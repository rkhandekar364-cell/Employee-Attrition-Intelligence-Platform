import io
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.services.data_service import (
    is_pii_column, 
    try_clean_numeric, 
    set_active_dataset, 
    get_active_dataset_info, 
    get_active_normalized_df
)

STANDARD_FIELD_DEFINITIONS = {
    "MonthlyIncome": ["salary", "monthlyincome", "monthly_income", "monthlyincomesalary", "income", "base_pay", "pay", "annual_salary", "ctc", "sal"],
    "Department": ["department", "dept", "departmentid", "department_id", "dept_id", "division", "business_unit"],
    "JobRole": ["jobrole", "job_role", "designation", "jobid", "job_id", "position", "title", "role"],
    "Age": ["age", "employeeage", "employee_age", "dob", "birth_date"],
    "YearsAtCompany": ["yearsatcompany", "years_at_company", "tenure", "companytenure", "years_in_company", "length_of_service", "service_years"],
    "JobSatisfaction": ["jobsatisfaction", "job_satisfaction", "satisfaction_score", "satisfaction"],
    "WorkLifeBalance": ["worklifebalance", "work_life_balance", "wlb_score", "work_life"],
    "OverTime": ["overtime", "over_time", "overtimestatus", "ot"],
    "HireDate": ["hiredate", "hire_date", "date_of_joining", "doj", "joined_date"],
    "Gender": ["gender", "sex"],
    "ManagerID": ["managerid", "manager_id", "supervisor_id", "reports_to"]
}

def evaluate_smart_mapping(columns: List[str]) -> Dict[str, Dict[str, Any]]:
    smart_mappings = {}
    used_cols = set()

    for std_field, aliases in STANDARD_FIELD_DEFINITIONS.items():
        matched_col = None
        confidence = "Low"
        reason = f"No standard match found for {std_field}"

        for col in columns:
            if col in used_cols:
                continue
            
            clean_col = str(col).strip().lower().replace('_', '').replace(' ', '').replace('-', '')
            
            # Explicit Rule: Never map Employee ID columns to Age, Salary, or Department
            if clean_col in ['employeeid', 'empid', 'id', 'idnumber', 'staffid']:
                continue

            clean_aliases = [a.replace('_', '').replace(' ', '').replace('-', '') for a in aliases]
            
            if clean_col in clean_aliases:
                matched_col = col
                confidence = "High"
                reason = f"Exact alias match for '{col}' -> '{std_field}'"
                used_cols.add(col)
                break

        if matched_col:
            smart_mappings[std_field] = {
                "column": matched_col,
                "confidence": confidence,
                "reason": reason
            }
        else:
            smart_mappings[std_field] = {
                "column": None,
                "confidence": "Low",
                "reason": reason
            }

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
        if not detected_attrition_col and col_lower in ['attrition', 'left', 'exited', 'turnover', 'is_attrited', 'employeeleft']:
            detected_attrition_col = col_str

        columns_info.append({
            "name": col_str,
            "data_type": dtype_str,
            "is_pii": is_pii,
            "sample_values": [str(v) for v in df[c].dropna().head(3).tolist()]
        })

    smart_mappings = evaluate_smart_mapping([str(c) for c in df.columns])
    missing_required = [field for field in STANDARD_FIELD_DEFINITIONS.keys() if smart_mappings.get(field, {}).get("column") is None]

    preview_df = df.head(15).copy()
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

def analyze_custom_dataset(df: pd.DataFrame, column_mappings: Dict[str, Optional[str]], target_column: Optional[str] = None, filename: str = "Uploaded_Dataset.csv") -> Dict[str, Any]:
    # Set as central active dataset in memory
    active_info = set_active_dataset(df, column_mappings, target_column, filename, is_custom=True)
    norm_df = get_active_normalized_df()

    row_count = len(norm_df)
    has_attrition = active_info["has_attrition"]

    # Compute company analytics components from normalized dataframe
    salary_data = None
    if "salary" in norm_df.columns and not norm_df["salary"].dropna().empty:
        s_series = norm_df["salary"].dropna()
        avg_sal = round(float(s_series.mean()), 2)
        min_sal = round(float(s_series.min()), 2)
        max_sal = round(float(s_series.max()), 2)
        med_sal = round(float(s_series.median()), 2)
        bins = [0, 3000, 5000, 10000, 15000, float('inf')]
        labels = ['<$3,000', '$3,000-$5,000', '$5,000-$10,000', '$10,000-$15,000', '>$15,000']
        binned = pd.cut(s_series, bins=bins, labels=labels, right=False)
        dist_counts = binned.value_counts().to_dict()
        salary_dist = [{"range": str(k), "count": int(v)} for k, v in dist_counts.items()]
        salary_data = {
            "available": True,
            "mapped_column": column_mappings.get('MonthlyIncome'),
            "avg_salary": avg_sal,
            "min_salary": min_sal,
            "max_salary": max_sal,
            "median_salary": med_sal,
            "distribution": salary_dist
        }
    else:
        salary_data = {"available": False, "mapped_column": None, "reason": "Salary column not mapped or empty"}

    dept_data = None
    if "department" in norm_df.columns and not norm_df["department"].dropna().empty:
        d_counts = norm_df["department"].value_counts().head(10).to_dict()
        dept_dist = [{"department": str(k), "count": int(v), "percentage": round((int(v)/row_count)*100, 1)} for k, v in d_counts.items()]
        dept_data = {
            "available": True,
            "mapped_column": column_mappings.get('Department'),
            "distribution": dept_dist
        }
    else:
        dept_data = {"available": False, "mapped_column": None, "reason": "Department column not mapped"}

    role_data = None
    if "job_role" in norm_df.columns and not norm_df["job_role"].dropna().empty:
        r_counts = norm_df["job_role"].value_counts().head(10).to_dict()
        role_dist = [{"role": str(k), "count": int(v), "percentage": round((int(v)/row_count)*100, 1)} for k, v in r_counts.items()]
        role_data = {
            "available": True,
            "mapped_column": column_mappings.get('JobRole'),
            "distribution": role_dist
        }
    else:
        role_data = {"available": False, "mapped_column": None, "reason": "Job Role column not mapped"}

    age_data = None
    if "age" in norm_df.columns and not norm_df["age"].dropna().empty:
        a_series = norm_df["age"].dropna()
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
            "mapped_column": column_mappings.get('Age'),
            "avg_age": avg_age,
            "min_age": min_age,
            "max_age": max_age,
            "distribution": age_dist
        }
    else:
        age_data = {"available": False, "mapped_column": None, "reason": "Age column not mapped or empty"}

    tenure_data = None
    if "years_at_company" in norm_df.columns and not norm_df["years_at_company"].dropna().empty:
        t_series = norm_df["years_at_company"].dropna()
        avg_tenure = round(float(t_series.mean()), 1)
        bins = [0, 3, 6, 11, float('inf')]
        labels = ['0-2 Years', '3-5 Years', '6-10 Years', '10+ Years']
        binned = pd.cut(t_series, bins=bins, labels=labels, right=False)
        dist_counts = binned.value_counts().to_dict()
        tenure_dist = [{"range": str(k), "count": int(v)} for k, v in dist_counts.items()]
        tenure_data = {
            "available": True,
            "mapped_column": column_mappings.get('YearsAtCompany'),
            "avg_tenure": avg_tenure,
            "distribution": tenure_dist
        }
    else:
        tenure_data = {"available": False, "mapped_column": None, "reason": "Tenure column not mapped or empty"}

    return {
        "filename": filename,
        "dataset_name": filename,
        "row_count": row_count,
        "column_count": active_info["column_count"],
        "quality_score": active_info["quality_score"],
        "has_attrition": has_attrition,
        "attrition_column": active_info["attrition_column"],
        "ml_readiness": active_info["ml_readiness"],
        "confirmed_mappings": column_mappings,
        "salary_analytics": salary_data,
        "department_analytics": dept_data,
        "job_role_analytics": role_data,
        "age_analytics": age_data,
        "tenure_analytics": tenure_data,
        "pii_columns": active_info["pii_columns"],
        "privacy_notice": "Privacy notice: Do not upload confidential or personally identifiable employee information."
    }

def get_current_company_analytics() -> Dict[str, Any]:
    info = get_active_dataset_info()
    norm_df = get_active_normalized_df()
    return analyze_custom_dataset(norm_df, {}, info.get("attrition_column"), info.get("filename", "active_dataset.csv"))
