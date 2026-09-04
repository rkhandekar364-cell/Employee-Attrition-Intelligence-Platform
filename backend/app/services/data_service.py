import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATA_PATH = BASE_DIR / "data" / "employee_attrition.csv"

PII_KEYWORDS = [
    'first_name', 'firstname', 'fname', 'first name',
    'last_name', 'lastname', 'lname', 'last name',
    'email', 'e-mail', 'mail',
    'phone', 'mobile', 'cell', 'telephone', 'phone_number',
    'ssn', 'social_security', 'national_id',
    'address', 'street', 'personal_email'
]

CURRENT_ACTIVE_DATASET: Dict[str, Any] = {
    "name": "ibm_hr_dataset.csv",
    "raw_df": None,
    "normalized_df": None,
    "mappings": {},
    "has_attrition": True,
    "has_hire_date": False,
    "attrition_column": "Attrition",
    "row_count": 0,
    "column_count": 0,
    "quality_score": 98.5,
    "is_custom": False,
    "pii_columns": []
}

def is_pii_column(col_name: str) -> bool:
    clean = str(col_name).strip().lower()
    return any(pii in clean for pii in PII_KEYWORDS)

def try_clean_numeric(series: pd.Series) -> pd.Series:
    if series is None:
        return pd.Series(dtype=float)
    if pd.api.types.is_numeric_dtype(series):
        return series
    cleaned = series.astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).str.strip()
    return pd.to_numeric(cleaned, errors='coerce')

def normalize_dataframe(df: pd.DataFrame, mappings: Dict[str, Optional[str]], target_column: Optional[str] = None) -> pd.DataFrame:
    norm_df = pd.DataFrame()
    row_count = len(df)

    # 1. Employee ID
    id_col = None
    for col in df.columns:
        c_clean = str(col).strip().lower().replace('_', '').replace(' ', '')
        if c_clean in ['employeenumber', 'employeeid', 'empid', 'id', 'idnumber', 'staffid']:
            id_col = col
            break
    if id_col and id_col in df.columns:
        norm_df['employee_id'] = df[id_col].astype(str)
    else:
        norm_df['employee_id'] = [f"EMP-{i+1:04d}" for i in range(row_count)]

    # 2. Age (Ignore EmployeeNumber/EmployeeCount)
    age_col = mappings.get('Age')
    if not age_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['age', 'employeeage']:
                age_col = c
                break
    if age_col and age_col in df.columns and not is_pii_column(age_col):
        norm_df['age'] = try_clean_numeric(df[age_col])
    else:
        norm_df['age'] = np.nan

    # 3. Monthly Income / Salary
    sal_col = mappings.get('MonthlyIncome')
    if not sal_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['monthlyincome', 'monthlyincomesalary', 'salary', 'income', 'compensation', 'basepay']:
                sal_col = c
                break
    if sal_col and sal_col in df.columns and not is_pii_column(sal_col):
        norm_df['salary'] = try_clean_numeric(df[sal_col])
    else:
        norm_df['salary'] = np.nan

    # 4. Department
    dept_col = mappings.get('Department')
    if not dept_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['department', 'dept', 'departmentid', 'deptid', 'division']:
                dept_col = c
                break
    if dept_col and dept_col in df.columns and not is_pii_column(dept_col):
        raw_dept = df[dept_col].fillna("Unassigned").astype(str).str.strip()
        norm_df['department'] = raw_dept.apply(lambda v: f"Dept {v}" if v.isdigit() else v)
    else:
        norm_df['department'] = "General"

    # 5. Job Role
    role_col = mappings.get('JobRole')
    if not role_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['jobrole', 'role', 'designation', 'position', 'jobid', 'title']:
                role_col = c
                break
    if role_col and role_col in df.columns and not is_pii_column(role_col):
        norm_df['job_role'] = df[role_col].fillna("General Staff").astype(str).str.strip()
    else:
        norm_df['job_role'] = "General Staff"

    # 6. OverTime
    ot_col = mappings.get('OverTime')
    if not ot_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['overtime', 'overtimestatus', 'ot']:
                ot_col = c
                break
    if ot_col and ot_col in df.columns and not is_pii_column(ot_col):
        raw_ot = df[ot_col].fillna("No").astype(str).str.strip().str.capitalize()
        norm_df['overtime'] = raw_ot.apply(lambda v: "Yes" if v in ["Yes", "1", "True", "Y"] else "No")
    else:
        norm_df['overtime'] = "No"

    # 7. Job Satisfaction
    sat_col = mappings.get('JobSatisfaction')
    if not sat_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['jobsatisfaction', 'satisfactionscore', 'satisfaction']:
                sat_col = c
                break
    if sat_col and sat_col in df.columns and not is_pii_column(sat_col):
        norm_df['job_satisfaction'] = try_clean_numeric(df[sat_col])
    else:
        norm_df['job_satisfaction'] = np.nan

    # 8. Years At Company / Tenure
    ten_col = mappings.get('YearsAtCompany')
    if not ten_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['yearsatcompany', 'tenure', 'companytenure', 'lengthofservice', 'serviceyears']:
                ten_col = c
                break
    if ten_col and ten_col in df.columns and not is_pii_column(ten_col):
        norm_df['years_at_company'] = try_clean_numeric(df[ten_col])
    else:
        norm_df['years_at_company'] = np.nan

    # 9. Gender (Fixed normalization: Female / Male)
    gen_col = mappings.get('Gender')
    if not gen_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if not is_pii_column(c) and c_clean in ['gender', 'sex']:
                gen_col = c
                break
    if gen_col and gen_col in df.columns and not is_pii_column(gen_col):
        raw_gen = df[gen_col].dropna().astype(str).str.strip().str.title()
        # Clean mapping for Female / Male
        norm_df['gender'] = df[gen_col].astype(str).apply(
            lambda v: "Female" if str(v).strip().lower() in ["female", "f"]
            else ("Male" if str(v).strip().lower() in ["male", "m"]
            else (str(v).strip().title() if pd.notnull(v) and str(v).strip() != "" and str(v).lower() != "nan" else "Unspecified"))
        )
    else:
        norm_df['gender'] = "Unspecified"

    # 10. Hire Date
    has_hire_date = False
    hire_col = mappings.get('HireDate')
    if not hire_col:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if c_clean in ['hiredate', 'dateofjoining', 'joiningdate', 'doj', 'joineddate']:
                hire_col = c
                break
    if hire_col and hire_col in df.columns:
        has_hire_date = True
        norm_df['hire_date'] = df[hire_col].astype(str)
    else:
        norm_df['hire_date'] = None

    # 11. Attrition (Target)
    has_attrition = False
    attr_col = target_column
    if not attr_col or attr_col == 'none' or attr_col not in df.columns:
        for c in df.columns:
            c_clean = str(c).strip().lower().replace('_', '').replace(' ', '')
            if c_clean in ['attrition', 'left', 'exited', 'turnover', 'isattrited', 'employeeleft']:
                attr_col = c
                break

    if attr_col and attr_col in df.columns and attr_col != 'none':
        has_attrition = True
        norm_df['attrition'] = df[attr_col].astype(str).apply(
            lambda v: "Yes" if str(v).strip().lower() in ["yes", "1", "true", "left", "exited", "y"] else "No"
        )
    else:
        norm_df['attrition'] = "No"

    norm_df['_has_attrition_target'] = has_attrition
    norm_df['_has_hire_date'] = has_hire_date
    return norm_df

def compute_quality_score(df: pd.DataFrame, norm_df: pd.DataFrame) -> float:
    row_count = len(df)
    column_count = df.shape[1]
    if row_count == 0 or column_count == 0:
        return 0.0

    total_cells = row_count * column_count
    missing_cells = int(df.isnull().sum().sum())
    dup_rows = int(df.duplicated().sum())

    completeness = max(0.0, 100.0 - (missing_cells / total_cells * 100.0))
    uniqueness = max(0.0, 100.0 - (dup_rows / row_count * 100.0))

    # Detected fields score
    key_fields = ['age', 'salary', 'department', 'job_role', 'overtime', 'years_at_company', 'gender', 'attrition']
    valid_keys = 0
    for k in key_fields:
        if k in norm_df.columns and not norm_df[k].dropna().empty and (norm_df[k] != "Unspecified").any() and (norm_df[k] != "General").any():
            valid_keys += 1

    field_coverage = (valid_keys / len(key_fields)) * 100.0
    quality_score = round(0.4 * completeness + 0.3 * uniqueness + 0.3 * field_coverage, 1)
    return quality_score

def load_default_ibm_dataset() -> pd.DataFrame:
    if DEFAULT_DATA_PATH.exists():
        return pd.read_csv(DEFAULT_DATA_PATH)
    
    # Fallback synthetic default dataset if file is missing
    rows = []
    depts = ["Sales", "Research & Development", "Human Resources"]
    roles = ["Sales Executive", "Research Scientist", "Laboratory Technician", "Manager", "Sales Representative"]
    np.random.seed(42)
    for i in range(1470):
        rows.append({
            "Age": int(np.random.randint(20, 60)),
            "Department": np.random.choice(depts, p=[0.3, 0.6, 0.1]),
            "JobRole": np.random.choice(roles),
            "MonthlyIncome": int(np.random.randint(2500, 19500)),
            "YearsAtCompany": int(np.random.randint(0, 20)),
            "JobSatisfaction": int(np.random.randint(1, 5)),
            "WorkLifeBalance": int(np.random.randint(1, 5)),
            "OverTime": np.random.choice(["Yes", "No"], p=[0.28, 0.72]),
            "Gender": np.random.choice(["Male", "Female"]),
            "Attrition": np.random.choice(["Yes", "No"], p=[0.16, 0.84])
        })
    return pd.DataFrame(rows)

def reset_to_default_dataset() -> Dict[str, Any]:
    global CURRENT_ACTIVE_DATASET
    df = load_default_ibm_dataset()
    mappings = {
        "MonthlyIncome": "MonthlyIncome",
        "Department": "Department",
        "JobRole": "JobRole",
        "Age": "Age",
        "YearsAtCompany": "YearsAtCompany",
        "JobSatisfaction": "JobSatisfaction",
        "OverTime": "OverTime",
        "Gender": "Gender"
    }
    norm_df = normalize_dataframe(df, mappings, target_column="Attrition")
    q_score = compute_quality_score(df, norm_df)

    CURRENT_ACTIVE_DATASET = {
        "name": "ibm_hr_dataset.csv",
        "raw_df": df,
        "normalized_df": norm_df,
        "mappings": mappings,
        "has_attrition": True,
        "has_hire_date": False,
        "attrition_column": "Attrition",
        "row_count": len(df),
        "column_count": df.shape[1],
        "quality_score": q_score,
        "is_custom": False,
        "pii_columns": []
    }
    return get_active_dataset_info()

def set_active_dataset(df: pd.DataFrame, mappings: Dict[str, Optional[str]], target_column: Optional[str], filename: str, is_custom: bool = True) -> Dict[str, Any]:
    global CURRENT_ACTIVE_DATASET
    norm_df = normalize_dataframe(df, mappings, target_column)
    has_attrition = bool(norm_df['_has_attrition_target'].iloc[0]) if len(norm_df) > 0 else False
    has_hire_date = bool(norm_df['_has_hire_date'].iloc[0]) if len(norm_df) > 0 else False

    q_score = compute_quality_score(df, norm_df)
    pii_cols = [str(c) for c in df.columns if is_pii_column(str(c))]

    CURRENT_ACTIVE_DATASET = {
        "name": filename,
        "raw_df": df,
        "normalized_df": norm_df,
        "mappings": mappings,
        "has_attrition": has_attrition,
        "has_hire_date": has_hire_date,
        "attrition_column": target_column if (target_column and target_column != 'none') else (target_column or None),
        "row_count": len(df),
        "column_count": df.shape[1],
        "quality_score": q_score,
        "is_custom": is_custom,
        "pii_columns": pii_cols
    }
    return get_active_dataset_info()

def get_active_dataset_info() -> Dict[str, Any]:
    if CURRENT_ACTIVE_DATASET["normalized_df"] is None:
        reset_to_default_dataset()
    
    return {
        "dataset_name": CURRENT_ACTIVE_DATASET["name"],
        "filename": CURRENT_ACTIVE_DATASET["name"],
        "row_count": CURRENT_ACTIVE_DATASET["row_count"],
        "records_count": CURRENT_ACTIVE_DATASET["row_count"],
        "column_count": CURRENT_ACTIVE_DATASET["column_count"],
        "has_attrition": CURRENT_ACTIVE_DATASET["has_attrition"],
        "has_hire_date": CURRENT_ACTIVE_DATASET["has_hire_date"],
        "attrition_column": CURRENT_ACTIVE_DATASET["attrition_column"],
        "quality_score": CURRENT_ACTIVE_DATASET["quality_score"],
        "is_custom": CURRENT_ACTIVE_DATASET["is_custom"],
        "pii_columns": CURRENT_ACTIVE_DATASET["pii_columns"],
        "ml_readiness": {
            "status": "Ready for Modeling" if CURRENT_ACTIVE_DATASET["has_attrition"] else "Target Not Detected",
            "message": "Supervised ML modeling enabled." if CURRENT_ACTIVE_DATASET["has_attrition"] else "Add a historical Attrition/Exited/Left column to enable supervised attrition modeling."
        }
    }

def get_active_normalized_df() -> pd.DataFrame:
    if CURRENT_ACTIVE_DATASET["normalized_df"] is None:
        reset_to_default_dataset()
    return CURRENT_ACTIVE_DATASET["normalized_df"]

def get_dashboard_summary(department=None, job_role=None, gender=None, overtime=None, age_range=None) -> Dict[str, Any]:
    df = get_active_normalized_df().copy()
    info = get_active_dataset_info()
    has_attrition = info["has_attrition"]
    has_hire_date = info["has_hire_date"]

    # Available filter options from current dataset (Excludes 'Unspecified')
    unique_genders = [str(g) for g in df["gender"].unique() if pd.notnull(g) and str(g) != "Unspecified"]
    
    filter_options = {
        "departments": ["All"] + sorted([str(d) for d in df["department"].unique() if pd.notnull(d)]),
        "job_roles": ["All"] + sorted([str(r) for r in df["job_role"].unique() if pd.notnull(r)]),
        "genders": ["All"] + sorted(unique_genders),
        "overtimes": ["All", "Yes", "No"],
        "age_ranges": ["All", "Under 25", "25-34", "35-44", "45-54", "55+"]
    }

    # Apply filters
    if department and department != "All":
        df = df[df["department"] == department]
    if job_role and job_role != "All":
        df = df[df["job_role"] == job_role]
    if gender and gender != "All":
        df = df[df["gender"] == gender]
    if overtime and overtime != "All":
        df = df[df["overtime"] == overtime]
    if age_range and age_range != "All":
        if age_range == "Under 25":
            df = df[df["age"] < 25]
        elif age_range == "25-34":
            df = df[(df["age"] >= 25) & (df["age"] <= 34)]
        elif age_range == "35-44":
            df = df[(df["age"] >= 35) & (df["age"] <= 44)]
        elif age_range == "45-54":
            df = df[(df["age"] >= 45) & (df["age"] <= 54)]
        elif age_range == "55+":
            df = df[df["age"] >= 55]

    total_employees = len(df)

    if has_attrition:
        attrition_count = len(df[df["attrition"] == "Yes"])
        attrition_rate = round((attrition_count / total_employees * 100.0), 1) if total_employees > 0 else 0.0
    else:
        attrition_count = 0
        attrition_rate = 0.0

    valid_sal = df["salary"].dropna()
    avg_income = round(float(valid_sal.mean()), 2) if not valid_sal.empty else 0.0
    med_income = round(float(valid_sal.median()), 2) if not valid_sal.empty else 0.0
    min_income = round(float(valid_sal.min()), 2) if not valid_sal.empty else 0.0
    max_income = round(float(valid_sal.max()), 2) if not valid_sal.empty else 0.0

    valid_age = df["age"].dropna()
    avg_age = round(float(valid_age.mean()), 1) if not valid_age.empty else 0.0

    valid_ten = df["years_at_company"].dropna()
    avg_tenure = round(float(valid_ten.mean()), 1) if not valid_ten.empty else 0.0

    # 1. Department Attrition Breakdown
    dept_attrition = []
    if "department" in df.columns:
        for dept_name, group in df.groupby("department"):
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            dept_attrition.append({
                "Department": str(dept_name),
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })

    # 2. Overtime Attrition
    overtime_attrition = []
    for ot_val in ["Yes", "No"]:
        group = df[df["overtime"] == ot_val]
        g_total = len(group)
        g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
        g_stay = g_total - g_left
        overtime_attrition.append({
            "OverTime": ot_val,
            "total": g_total,
            "stay": g_stay,
            "left": g_left,
            "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
        })

    # 3. Gender Distribution & Attrition
    gender_attrition = []
    if "gender" in df.columns:
        for g_name, group in df.groupby("gender"):
            if str(g_name) == "Unspecified" and len(df["gender"].unique()) > 1:
                continue
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            gender_attrition.append({
                "Gender": str(g_name),
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })

    # 4. Job Role Attrition Rate
    job_role_attrition = []
    if "job_role" in df.columns:
        for r_name, group in df.groupby("job_role"):
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            job_role_attrition.append({
                "JobRole": str(r_name),
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })
    job_role_attrition.sort(key=lambda x: x["rate"], reverse=True)

    # 5. Tenure Distribution
    tenure_distribution = []
    if not valid_ten.empty:
        bins = [0, 3, 6, 11, 100]
        labels = ["0-2 Years", "3-5 Years", "6-10 Years", "10+ Years"]
        df_copy = df.copy()
        df_copy["tenure_range"] = pd.cut(df_copy["years_at_company"], bins=bins, labels=labels, right=False)
        for label in labels:
            group = df_copy[df_copy["tenure_range"] == label]
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            tenure_distribution.append({
                "TenureRange": label,
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })

    # 6. Age Group Attrition
    age_group_attrition = []
    if not valid_age.empty:
        bins = [0, 25, 35, 45, 55, 100]
        labels = ["Under 25", "25-34", "35-44", "45-54", "55+"]
        df_copy = df.copy()
        df_copy["age_group"] = pd.cut(df_copy["age"], bins=bins, labels=labels, right=False)
        for label in labels:
            group = df_copy[df_copy["age_group"] == label]
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            age_group_attrition.append({
                "AgeGroup": label,
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })

    # 7. Income Range Attrition
    income_range_attrition = []
    if not valid_sal.empty:
        bins = [0, 3000, 5000, 10000, 15000, float('inf')]
        labels = ["<$3k", "$3k-$5k", "$5k-$10k", "$10k-$15k", ">$15k"]
        df_copy = df.copy()
        df_copy["income_range"] = pd.cut(df_copy["salary"], bins=bins, labels=labels, right=False)
        for label in labels:
            group = df_copy[df_copy["income_range"] == label]
            g_total = len(group)
            g_left = len(group[group["attrition"] == "Yes"]) if has_attrition else 0
            g_stay = g_total - g_left
            income_range_attrition.append({
                "IncomeRange": label,
                "total": g_total,
                "stay": g_stay,
                "left": g_left,
                "rate": round((g_left / g_total * 100.0), 1) if g_total > 0 else 0.0
            })

    return {
        "dataset_name": info["dataset_name"],
        "has_attrition": has_attrition,
        "has_hire_date": has_hire_date,
        "is_custom": info["is_custom"],
        "total_employees": total_employees,
        "attrition_count": attrition_count,
        "attrition_rate": attrition_rate,
        "avg_age": avg_age,
        "avg_monthly_income": avg_income,
        "median_monthly_income": med_income,
        "min_monthly_income": min_income,
        "max_monthly_income": max_income,
        "avg_years_at_company": avg_tenure,
        "filter_options": filter_options,
        "department_attrition": dept_attrition,
        "overtime_attrition": overtime_attrition,
        "gender_attrition": gender_attrition,
        "job_role_attrition": job_role_attrition,
        "tenure_distribution": tenure_distribution,
        "age_group_attrition": age_group_attrition,
        "income_range_attrition": income_range_attrition
    }

def get_eda_data() -> Dict[str, Any]:
    df = get_active_normalized_df()
    info = get_active_dataset_info()
    has_attrition = info["has_attrition"]

    dept_dist = df["department"].value_counts().to_dict()
    dept_attr = {}
    if has_attrition:
        dept_attr = df.groupby("department")["attrition"].apply(lambda s: (s == "Yes").sum()).to_dict()

    ot_attr = {}
    if has_attrition:
        ot_attr = df.groupby("overtime")["attrition"].apply(lambda s: (s == "Yes").sum()).to_dict()

    return {
        "dataset_name": info["dataset_name"],
        "has_attrition": has_attrition,
        "record_count": len(df),
        "department_distribution": dept_dist,
        "attrition_by_department": dept_attr,
        "overtime_attrition": ot_attr
    }

def get_calculated_insights() -> List[Dict[str, Any]]:
    df = get_active_normalized_df()
    info = get_active_dataset_info()
    has_attrition = info["has_attrition"]

    insights = []
    
    if has_attrition:
        ot_yes = df[df["overtime"] == "Yes"]
        ot_no = df[df["overtime"] == "No"]
        rate_yes = round((len(ot_yes[ot_yes["attrition"] == "Yes"]) / len(ot_yes) * 100), 1) if len(ot_yes) > 0 else 0
        rate_no = round((len(ot_no[ot_no["attrition"] == "Yes"]) / len(ot_no) * 100), 1) if len(ot_no) > 0 else 0
        
        insights.append({
            "category": "Workload & Burnout",
            "title": "Mandatory Overtime Attrition Risk",
            "finding": f"Employees working overtime exhibit an attrition rate of {rate_yes}%, compared to {rate_no}% for non-overtime staff.",
            "recommendation": "Review team overtime distribution and cap recurring weekend/evening shifts to minimize turnover."
        })

        low_sal = df[df["salary"] < 4000]
        if not low_sal.empty:
            low_sal_rate = round((len(low_sal[low_sal["attrition"] == "Yes"]) / len(low_sal) * 100), 1)
            insights.append({
                "category": "Compensation",
                "title": "Entry-Level Compensation Benchmark",
                "finding": f"Employees earning under $4,000 monthly show a turnover rate of {low_sal_rate}%.",
                "recommendation": "Perform compensation parity benchmarking for early-career roles."
            })
    else:
        dept_counts = df["department"].value_counts().to_dict()
        top_dept = max(dept_counts, key=dept_counts.get) if dept_counts else "General"
        insights.append({
            "category": "Workforce Distribution",
            "title": f"Department Staffing Concentration ({top_dept})",
            "finding": f"The '{top_dept}' department represents the largest workforce concentration in the active dataset ({dept_counts.get(top_dept, 0)} employees).",
            "recommendation": "Ensure proportional HR management and resource allocation across major department units."
        })

    return insights

# Initialize with default IBM HR 1,470 dataset on startup
reset_to_default_dataset()
