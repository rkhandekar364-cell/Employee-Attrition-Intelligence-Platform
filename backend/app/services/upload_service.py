import io
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from app.services.data_service import (
    is_pii_column, 
    try_clean_numeric, 
    set_active_dataset, 
    get_active_dataset_info, 
    get_active_normalized_df
)

EXPANDED_ALIASES = {
    "MonthlyIncome": [
        "monthlyincome", "monthly income", "monthly_income", "monthly-income",
        "monthly salary", "monthlysalary", "monthly_salary", "monthly salary compensation",
        "salary", "income", "compensation", "base pay", "basepay", "pay",
        "monthly income salary", "annual salary", "ctc", "sal"
    ],
    "Department": [
        "department", "dept", "department name", "department_name", "department id", "department_id",
        "dept id", "dept_id", "dept name", "division", "business unit"
    ],
    "JobRole": [
        "jobrole", "job role", "job_role", "job role name", "job title",
        "designation", "position", "role", "job id", "job_id", "title"
    ],
    "Age": [
        "age", "employee age", "employee_age", "emp age", "dob", "birth date", "date of birth"
    ],
    "Gender": [
        "gender", "sex", "employee gender"
    ],
    "OverTime": [
        "overtime", "over time", "over_time", "overtime status", "overtime_status",
        "overtime requirement", "ot", "ot status"
    ],
    "YearsAtCompany": [
        "yearsatcompany", "years at company", "years_at_company", "years at company tenure",
        "tenure", "company tenure", "company_tenure", "length of service", "service years", "years in company"
    ],
    "JobSatisfaction": [
        "jobsatisfaction", "job satisfaction", "job_satisfaction", "job satisfaction rating",
        "satisfaction rating", "satisfaction score", "satisfaction", "job sat"
    ],
    "WorkLifeBalance": [
        "worklifebalance", "work life balance", "work_life_balance", "wlb score", "wlb"
    ],
    "HireDate": [
        "hiredate", "hire date", "hire_date", "joining date", "joiningdate", "joining_date",
        "date of joining", "date joined", "doj", "joined date"
    ],
    "ManagerID": [
        "managerid", "manager id", "manager_id", "supervisor id", "supervisor_id", "reports to"
    ]
}

def normalize_column_name(col_name: str) -> str:
    if not col_name:
        return ""
    s = str(col_name).strip().lower()
    s = re.sub(r'[\/\\\-\_\.\(\)\[\]\,\:\;]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def validate_value_pattern(series: pd.Series, std_field: str) -> bool:
    clean_s = series.dropna()
    if clean_s.empty:
        return False
    
    if std_field == "Age":
        nums = try_clean_numeric(clean_s).dropna()
        if not nums.empty:
            mean_val = nums.mean()
            return 15 <= mean_val <= 85
    elif std_field == "MonthlyIncome":
        nums = try_clean_numeric(clean_s).dropna()
        if not nums.empty:
            mean_val = nums.mean()
            return mean_val > 100
    elif std_field == "YearsAtCompany":
        nums = try_clean_numeric(clean_s).dropna()
        if not nums.empty:
            mean_val = nums.mean()
            return 0 <= mean_val <= 50
    elif std_field == "OverTime":
        vals = clean_s.astype(str).str.lower().str.strip().unique()
        return any(v in ['yes', 'no', 'true', 'false', '1', '0', 'y', 'n'] for v in vals)
    elif std_field == "HireDate":
        parsed = pd.to_datetime(clean_s.head(10), errors='coerce')
        return not parsed.dropna().empty
    elif std_field == "JobSatisfaction":
        nums = try_clean_numeric(clean_s).dropna()
        if not nums.empty:
            return nums.min() >= 1 and nums.max() <= 10

    return True

def evaluate_smart_mapping(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    smart_mappings = {}
    used_cols = set()
    columns = list(df.columns)

    for std_field, aliases in EXPANDED_ALIASES.items():
        matched_col = None
        confidence_score = 0
        confidence_level = "Low"
        reasoning = f"No compatible column detected for {std_field}"

        for col in columns:
            if col in used_cols:
                continue

            norm_col = normalize_column_name(col)
            
            # Explicit Exclusion Rule: Never map ID / Count columns to Age, Salary, or Department
            if norm_col in ['employee number', 'employeenumber', 'employee count', 'employeecount', 'employee id', 'employeeid', 'empid', 'id', 'id number', 'staff id', 'standard hours', 'over18']:
                continue

            # LEVEL 1: Exact Normalized Header Match
            norm_target = normalize_column_name(std_field)
            if norm_col == norm_target:
                matched_col = col
                confidence_score = 98
                confidence_level = "High"
                reasoning = f"Matched '{col}' to {std_field} using exact normalized header match"
                used_cols.add(col)
                break

            # LEVEL 2: Alias Match
            clean_aliases = [normalize_column_name(a) for a in aliases]
            if norm_col in clean_aliases:
                matched_col = col
                confidence_score = 94
                confidence_level = "High"
                reasoning = f"Matched '{col}' to {std_field} using normalized semantic alias"
                used_cols.add(col)
                break

            # LEVEL 3: Token / Word Similarity Match
            tokens = set(norm_col.split())
            if std_field == "MonthlyIncome" and ("salary" in tokens or "income" in tokens or "compensation" in tokens or "pay" in tokens):
                matched_col = col
                confidence_score = 90
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Monthly Income / Salary using word similarity"
                used_cols.add(col)
                break
            elif std_field == "JobRole" and ("designation" in tokens or "role" in tokens or "position" in tokens or "title" in tokens):
                matched_col = col
                confidence_score = 90
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Job Role using word similarity"
                used_cols.add(col)
                break
            elif std_field == "YearsAtCompany" and ("tenure" in tokens or "years" in tokens or "service" in tokens):
                matched_col = col
                confidence_score = 88
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Years at Company / Tenure using token similarity"
                used_cols.add(col)
                break
            elif std_field == "OverTime" and ("overtime" in norm_col or "ot" in tokens):
                matched_col = col
                confidence_score = 92
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Overtime Status using token similarity"
                used_cols.add(col)
                break
            elif std_field == "HireDate" and ("joining" in tokens or "joined" in tokens or "hire" in tokens):
                matched_col = col
                confidence_score = 92
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Hire Date using token similarity"
                used_cols.add(col)
                break
            elif std_field == "Age" and ("age" in tokens):
                matched_col = col
                confidence_score = 90
                confidence_level = "High"
                reasoning = f"Matched '{col}' to Employee Age using token similarity"
                used_cols.add(col)
                break

        # LEVEL 4: Value-Pattern & Data Type Validation
        if matched_col and validate_value_pattern(df[matched_col], std_field):
            confidence_score = min(99, confidence_score + 5)
            reasoning += " (Validated value patterns)"

        if matched_col:
            smart_mappings[std_field] = {
                "column": matched_col,
                "confidence_score": confidence_score,
                "confidence": confidence_level,
                "reason": reasoning
            }
        else:
            smart_mappings[std_field] = {
                "column": None,
                "confidence_score": 0,
                "confidence": "Low",
                "reason": reasoning
            }

    return smart_mappings

def compute_database_quality_score(df: pd.DataFrame, smart_mappings: Dict[str, Dict[str, Any]]) -> Tuple[float, Dict[str, Any]]:
    row_count = len(df)
    column_count = df.shape[1]
    if row_count == 0 or column_count == 0:
        return 0.0, {
            "completeness": 0.0,
            "validity": 0.0,
            "duplicate_free": 0.0,
            "required_fields_detected": "0/8",
            "detected_count": 0,
            "total_count": 8
        }

    total_cells = row_count * column_count
    missing_cells = int(df.isnull().sum().sum())
    dup_rows = int(df.duplicated().sum())

    # 1. Completeness: % of non-empty cells
    completeness = round(max(0.0, (1.0 - (missing_cells / total_cells)) * 100.0), 1)

    # 2. Validity: % valid values across cells
    valid_cells = 0
    for col in df.columns:
        valid_cells += int(df[col].notnull().sum())
    validity = round((valid_cells / total_cells) * 100.0, 1)

    # 3. DuplicateQuality: % of non-duplicate rows
    duplicate_free = round(max(0.0, (1.0 - (dup_rows / row_count)) * 100.0), 1)

    # 4. RequiredFieldCoverage: % of detected business fields
    key_fields = ["MonthlyIncome", "Department", "JobRole", "Age", "Gender", "OverTime", "YearsAtCompany", "JobSatisfaction"]
    detected_count = sum(1 for k in key_fields if smart_mappings.get(k, {}).get("column") is not None)
    coverage = round((detected_count / len(key_fields)) * 100.0, 1)

    # Database Quality Score Formula:
    # 0.40 * Completeness + 0.30 * Validity + 0.15 * DuplicateQuality + 0.15 * RequiredFieldCoverage
    quality_score = round(0.40 * completeness + 0.30 * validity + 0.15 * duplicate_free + 0.15 * coverage, 1)

    breakdown = {
        "completeness": completeness,
        "validity": validity,
        "duplicate_free": duplicate_free,
        "required_fields_detected": f"{detected_count}/{len(key_fields)}",
        "detected_count": detected_count,
        "total_count": len(key_fields)
    }

    return quality_score, breakdown

def analyze_uploaded_dataset(file_contents: bytes, filename: str) -> Dict[str, Any]:
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    # Unified File Reader Pipeline (CSV & Excel)
    if ext in ['csv', 'tsv']:
        try:
            df = pd.read_csv(io.BytesIO(file_contents))
        except Exception:
            df = pd.read_csv(io.BytesIO(file_contents), encoding='latin-1')
    else:
        try:
            df = pd.read_excel(io.BytesIO(file_contents))
        except Exception as e:
            raise ValueError(f"Failed to parse Excel file '{filename}': {str(e)}")

    row_count = int(len(df))
    column_count = int(df.shape[1])

    # Extract Columns & Detect PII / Target
    columns_info = []
    pii_cols = []
    detected_attrition_col = None

    for c in df.columns:
        col_str = str(c)
        is_pii = is_pii_column(col_str)
        if is_pii:
            pii_cols.append(col_str)
        
        dtype_str = str(df[c].dtype)
        col_norm = normalize_column_name(col_str)
        if not detected_attrition_col and col_norm in ['attrition', 'left', 'exited', 'turnover', 'is attrited', 'employee left']:
            detected_attrition_col = col_str

        columns_info.append({
            "name": col_str,
            "data_type": dtype_str,
            "is_pii": is_pii,
            "sample_values": [str(v) for v in df[c].dropna().head(3).tolist()]
        })

    # Smart Schema Mapping Engine
    smart_mappings = evaluate_smart_mapping(df)

    # Compute Database Quality Score with transparent breakdown
    db_quality_score, quality_breakdown = compute_database_quality_score(df, smart_mappings)

    missing_required = [field for field in EXPANDED_ALIASES.keys() if smart_mappings.get(field, {}).get("column") is None]

    preview_df = df.head(15).copy()
    for p_col in pii_cols:
        if p_col in preview_df.columns:
            preview_df[p_col] = "***MASKED***"
    preview_records = preview_df.fillna("").to_dict(orient='records')

    return {
        "filename": filename,
        "row_count": row_count,
        "column_count": column_count,
        "database_quality_score": db_quality_score,
        "data_quality_score": db_quality_score,
        "quality_score": db_quality_score,
        "quality_breakdown": quality_breakdown,
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
    has_hire_date = active_info["has_hire_date"]

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
            "mapped_column": column_mappings.get('MonthlyIncome') or "MonthlyIncome",
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
            "mapped_column": column_mappings.get('Department') or "Department",
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
            "mapped_column": column_mappings.get('JobRole') or "JobRole",
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
            "mapped_column": column_mappings.get('Age') or "Age",
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
            "mapped_column": column_mappings.get('YearsAtCompany') or "YearsAtCompany",
            "avg_tenure": avg_tenure,
            "distribution": tenure_dist
        }
    else:
        tenure_data = {"available": False, "mapped_column": None, "reason": "Tenure column not mapped or empty"}

    hiring_trend = None
    if has_hire_date and "hire_date" in norm_df.columns:
        try:
            dates = pd.to_datetime(norm_df["hire_date"], errors='coerce')
            valid_dates = dates.dropna()
            if not valid_dates.empty:
                by_year = valid_dates.dt.year.value_counts().sort_index().to_dict()
                hiring_trend = [{"year": str(int(k)), "hires": int(v)} for k, v in by_year.items()]
        except Exception:
            hiring_trend = None

    return {
        "filename": filename,
        "dataset_name": filename,
        "row_count": row_count,
        "column_count": active_info["column_count"],
        "database_quality_score": active_info["quality_score"],
        "data_quality_score": active_info["quality_score"],
        "quality_score": active_info["quality_score"],
        "has_attrition": has_attrition,
        "has_hire_date": has_hire_date,
        "attrition_column": active_info["attrition_column"],
        "ml_readiness": active_info["ml_readiness"],
        "confirmed_mappings": column_mappings,
        "salary_analytics": salary_data,
        "department_analytics": dept_data,
        "job_role_analytics": role_data,
        "age_analytics": age_data,
        "tenure_analytics": tenure_data,
        "hiring_trend": hiring_trend,
        "pii_columns": active_info["pii_columns"],
        "privacy_notice": "Privacy notice: Do not upload confidential or personally identifiable employee information."
    }

def get_current_company_analytics() -> Dict[str, Any]:
    info = get_active_dataset_info()
    norm_df = get_active_normalized_df()
    return analyze_custom_dataset(norm_df, {}, info.get("attrition_column"), info.get("filename", "ibm_hr_dataset.csv"))
