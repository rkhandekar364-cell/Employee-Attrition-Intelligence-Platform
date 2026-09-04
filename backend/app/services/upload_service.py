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

# Standard Target Field Definitions for UI Selection & Mapping
SEMANTIC_TARGET_FIELDS = [
    {"key": "MonthlyIncome", "label": "Monthly Income / Salary", "category": "Numeric"},
    {"key": "Department", "label": "Department / Division", "category": "Categorical"},
    {"key": "JobRole", "label": "Job Role / Designation", "category": "Categorical"},
    {"key": "HireDate", "label": "Hire Date / Joining Date", "category": "Date"},
    {"key": "Age", "label": "Employee Age", "category": "Numeric"},
    {"key": "Gender", "label": "Gender / Sex", "category": "Categorical"},
    {"key": "OverTime", "label": "Overtime Status", "category": "Categorical"},
    {"key": "YearsAtCompany", "label": "Years at Company / Tenure", "category": "Numeric"},
    {"key": "JobSatisfaction", "label": "Job Satisfaction Rating", "category": "Numeric"},
    {"key": "WorkLifeBalance", "label": "Work Life Balance Rating", "category": "Numeric"},
    {"key": "ManagerID", "label": "Manager / Supervisor ID", "category": "Text"},
    {"key": "Attrition", "label": "Historical Attrition Target (Yes/No)", "category": "Categorical"},
    {"key": "EmploymentStatus", "label": "Employment Status / Job Status", "category": "Categorical"},
    {"key": "EmployeeName", "label": "Employee Name", "category": "Text"},
    {"key": "Email", "label": "Email Address", "category": "Text"},
    {"key": "Unmapped", "label": "-- Unmapped / Other --", "category": "Other"}
]

# Robust Semantic Alias Dictionary
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
        "designation", "position", "role", "position title", "job id", "job_id", "title"
    ],
    "Age": [
        "age", "employee age", "employee_age", "emp age", "dob", "birth date", "date of birth"
    ],
    "Gender": [
        "gender", "sex", "employee gender"
    ],
    "OverTime": [
        "overtime", "over time", "over_time", "overtime status", "overtime_status",
        "overtime requirement", "overtime_required", "ot", "ot status"
    ],
    "YearsAtCompany": [
        "yearsatcompany", "years at company", "years_at_company", "years at company tenure",
        "tenure", "company tenure", "company_tenure", "length of service", "service years", "years of service", "years in company"
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
        "date of joining", "date joined", "start date", "doj", "joined date"
    ],
    "ManagerID": [
        "managerid", "manager id", "manager_id", "supervisor id", "supervisor_id", "reports to"
    ],
    "Attrition": [
        "attrition", "employee attrition", "left company", "left", "turnover", "exited", "is attrited", "employee left"
    ],
    "EmploymentStatus": [
        "job status", "employment status", "employee status", "status", "jobstatus", "employmentstatus", "employeestatus"
    ],
    "EmployeeName": [
        "name", "employee name", "emp name", "full name", "first name", "last name", "employee_name"
    ],
    "Email": [
        "email", "email address", "e mail", "mail", "personal email", "email_address"
    ]
}

def normalize_column_name(col_name: str) -> str:
    if not col_name:
        return ""
    s = str(col_name).strip().lower()
    s = re.sub(r'[\/\\\-\_\.\(\)\[\]\,\:\;]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def infer_column_data_type(series: pd.Series, col_name: str) -> str:
    col_clean = normalize_column_name(col_name)
    if is_pii_column(col_name) or "email" in col_clean or "mail" in col_clean:
        return "Email / PII"
    
    clean_s = series.dropna()
    if clean_s.empty:
        return "Text"

    # Try Date detection
    if "date" in col_clean or "joining" in col_clean or "hire" in col_clean or "doj" in col_clean:
        parsed = pd.to_datetime(clean_s.head(10), errors='coerce')
        if not parsed.dropna().empty:
            return "Date"
            
    # Try Numeric
    numeric_s = try_clean_numeric(clean_s).dropna()
    if len(numeric_s) / len(clean_s) >= 0.7:
        return "Numeric"
        
    # Check Categorical vs Text
    unique_cnt = clean_s.nunique()
    if unique_cnt <= 15 or unique_cnt / len(clean_s) <= 0.3:
        return "Categorical"
        
    return "Text"

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

# Dataset-Dynamic Column-Centric Schema Matcher
def detect_uploaded_column_schema(df: pd.DataFrame) -> List[Dict[str, Any]]:
    column_detections = []
    used_std_fields = set()

    for col in df.columns:
        col_str = str(col)
        norm_col = normalize_column_name(col_str)
        detected_type = infer_column_data_type(df[col], col_str)
        sample_vals = [str(v) for v in df[col].dropna().head(3).tolist()]
        is_pii = is_pii_column(col_str)

        best_field = "Unmapped"
        best_label = "-- Unmapped / Other --"
        confidence_score = 0
        confidence_level = "Low"
        reason = "Uncertain mapping — manual assignment required"

        # Explicit Exclusion Rules
        is_id_col = norm_col in ['employee number', 'employeenumber', 'employee count', 'employeecount', 'employee id', 'employeeid', 'empid', 'id', 'id number', 'staff id']
        
        # Explicit Separation: Job Status is EmploymentStatus, NOT JobRole or Attrition
        if norm_col in ['job status', 'employment status', 'employee status', 'status', 'jobstatus', 'employmentstatus']:
            best_field = "EmploymentStatus"
            best_label = "Employment Status / Job Status"
            confidence_score = 95
            confidence_level = "High"
            reason = "Matched 'Job Status' to Employment Status using explicit semantic rule (Excluded from Job Role / Attrition)"
        elif not is_id_col:
            # Match against semantic alias dictionary
            for std_field, aliases in EXPANDED_ALIASES.items():
                if std_field in used_std_fields and std_field not in ["Unmapped", "EmploymentStatus", "EmployeeName", "Email"]:
                    continue

                norm_target = normalize_column_name(std_field)
                clean_aliases = [normalize_column_name(a) for a in aliases]

                # LEVEL 1: Exact Normalized Header Match
                if norm_col == norm_target:
                    best_field = std_field
                    confidence_score = 99
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' using exact normalized header match"
                    break

                # LEVEL 2: Alias Match
                if norm_col in clean_aliases:
                    best_field = std_field
                    confidence_score = 98
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' using normalized semantic alias"
                    break

                # LEVEL 3: Token / Word Similarity Match
                tokens = set(norm_col.split())
                if std_field == "MonthlyIncome" and ("salary" in tokens or "income" in tokens or "compensation" in tokens or "pay" in tokens):
                    best_field = std_field
                    confidence_score = 92
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' to Monthly Income / Salary using word similarity"
                    break
                elif std_field == "JobRole" and ("designation" in tokens or "role" in tokens or "position" in tokens or "title" in tokens):
                    # NEVER map department or status to job role
                    if "dept" not in tokens and "department" not in tokens and "status" not in tokens:
                        best_field = std_field
                        confidence_score = 90
                        confidence_level = "High"
                        reason = f"Matched '{col_str}' to Job Role using word similarity"
                        break
                elif std_field == "YearsAtCompany" and ("tenure" in tokens or "years" in tokens or "service" in tokens):
                    best_field = std_field
                    confidence_score = 88
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' to Tenure using word similarity"
                    break
                elif std_field == "HireDate" and ("joining" in tokens or "joined" in tokens or "hire" in tokens or "start" in tokens):
                    best_field = std_field
                    confidence_score = 95
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' to Hire Date using word similarity"
                    break
                elif std_field == "Age" and ("age" in tokens):
                    best_field = std_field
                    confidence_score = 92
                    confidence_level = "High"
                    reason = f"Matched '{col_str}' to Employee Age using word similarity"
                    break
                elif std_field == "Gender" and ("gender" in tokens or "sex" in tokens):
                    # NEVER infer gender from Name
                    if "name" not in tokens:
                        best_field = std_field
                        confidence_score = 95
                        confidence_level = "High"
                        reason = f"Matched '{col_str}' to Gender using word similarity"
                        break

        # Value pattern validation boost
        if best_field != "Unmapped" and validate_value_pattern(df[col], best_field):
            confidence_score = min(99, confidence_score + 2)
            reason += " (Validated value patterns)"

        if best_field != "Unmapped" and best_field not in ["EmploymentStatus", "EmployeeName", "Email"]:
            used_std_fields.add(best_field)

        # Lookup label
        for field_def in SEMANTIC_TARGET_FIELDS:
            if field_def["key"] == best_field:
                best_label = field_def["label"]
                break

        column_detections.append({
            "original_column": col_str,
            "detected_type": detected_type,
            "semantic_field": best_field,
            "semantic_label": best_label,
            "confidence_score": confidence_score,
            "confidence": confidence_level,
            "reason": reason,
            "sample_values": sample_vals,
            "is_pii": is_pii
        })

    return column_detections

def compute_database_quality_score(df: pd.DataFrame, column_detections: List[Dict[str, Any]]) -> Tuple[float, Dict[str, Any]]:
    row_count = len(df)
    column_count = df.shape[1]
    if row_count == 0 or column_count == 0:
        return 0.0, {
            "completeness": 0.0,
            "validity": 0.0,
            "duplicate_free": 0.0,
            "consistency": 0.0,
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

    # 3. Duplicate-free: % of non-duplicate rows
    duplicate_free = round(max(0.0, (1.0 - (dup_rows / row_count)) * 100.0), 1)

    # 4. Data Type Consistency
    consistent_cols = 0
    for col in df.columns:
        clean = df[col].dropna()
        if not clean.empty:
            types = clean.map(type).nunique()
            if types <= 2: # e.g. int/float or str
                consistent_cols += 1
    consistency = round((consistent_cols / column_count) * 100.0, 1)

    # 5. Required Field Coverage
    key_fields = ["MonthlyIncome", "Department", "JobRole", "Age", "Gender", "OverTime", "YearsAtCompany", "JobSatisfaction"]
    detected_fields = set(d["semantic_field"] for d in column_detections if d["semantic_field"] != "Unmapped")
    detected_count = sum(1 for k in key_fields if k in detected_fields)
    coverage = round((detected_count / len(key_fields)) * 100.0, 1)

    # Independent Database Quality Score Formula:
    # 0.35 * Completeness + 0.35 * Validity + 0.15 * DuplicateFree + 0.15 * Consistency
    quality_score = round(0.35 * completeness + 0.35 * validity + 0.15 * duplicate_free + 0.15 * consistency, 1)

    breakdown = {
        "completeness": completeness,
        "validity": validity,
        "duplicate_free": duplicate_free,
        "consistency": consistency,
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

    # Dynamic Column Detection Engine
    column_detections = detect_uploaded_column_schema(df)

    # Detect Target & PII
    pii_cols = [d["original_column"] for d in column_detections if d["is_pii"]]
    attrition_detection = next((d for d in column_detections if d["semantic_field"] == "Attrition"), None)
    detected_attrition_col = attrition_detection["original_column"] if attrition_detection else None

    # Compute Database Quality Score independently of semantic mapping
    db_quality_score, quality_breakdown = compute_database_quality_score(df, column_detections)

    # Backward-compatible smart_mappings dict
    smart_mappings = {}
    for d in column_detections:
        field = d["semantic_field"]
        if field != "Unmapped":
            smart_mappings[field] = {
                "column": d["original_column"],
                "confidence_score": d["confidence_score"],
                "confidence": d["confidence"],
                "reason": d["reason"]
            }

    # Small Dataset Handling
    is_small_dataset = row_count < 100
    small_dataset_message = f"Small dataset: {row_count} records detected. Some analytics and predictive modeling may be limited." if is_small_dataset else None

    preview_df = df.head(15).copy()
    for p_col in pii_cols:
        if p_col in preview_df.columns:
            preview_df[p_col] = "***MASKED***"
    preview_records = preview_df.fillna("").to_dict(orient='records')

    # Capability Matrix Object
    detected_set = set(d["semantic_field"] for d in column_detections if d["semantic_field"] != "Unmapped")
    capabilities = {
        "salary": "MonthlyIncome" in detected_set,
        "department": "Department" in detected_set,
        "jobRole": "JobRole" in detected_set,
        "hireDate": "HireDate" in detected_set,
        "age": "Age" in detected_set,
        "gender": "Gender" in detected_set,
        "overtime": "OverTime" in detected_set,
        "tenure": "YearsAtCompany" in detected_set,
        "satisfaction": "JobSatisfaction" in detected_set,
        "attrition": "Attrition" in detected_set,
        "employmentStatus": "EmploymentStatus" in detected_set
    }

    return {
        "filename": filename,
        "row_count": row_count,
        "column_count": column_count,
        "database_quality_score": db_quality_score,
        "data_quality_score": db_quality_score,
        "quality_score": db_quality_score,
        "quality_breakdown": quality_breakdown,
        "detected_attrition_column": detected_attrition_col,
        "column_detections": column_detections,
        "smart_mappings": smart_mappings,
        "capabilities": capabilities,
        "is_small_dataset": is_small_dataset,
        "small_dataset_message": small_dataset_message,
        "preview_data": preview_records,
        "column_names": [str(c) for c in df.columns],
        "semantic_target_fields": SEMANTIC_TARGET_FIELDS
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
