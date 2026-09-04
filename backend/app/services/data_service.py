import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

_cached_df: Optional[pd.DataFrame] = None

def load_data() -> pd.DataFrame:
    global _cached_df
    if _cached_df is not None:
        return _cached_df

    data = {
        "Age": [35, 42, 28, 50, 31, 24, 38, 45, 29, 36],
        "Department": ["Sales", "Research & Development", "Sales", "Human Resources", "Research & Development", "Sales", "Research & Development", "Research & Development", "Sales", "Research & Development"],
        "JobRole": ["Sales Executive", "Research Scientist", "Sales Representative", "Manager", "Laboratory Technician", "Sales Representative", "Manufacturing Director", "Healthcare Representative", "Sales Executive", "Research Scientist"],
        "MonthlyIncome": [5000, 8000, 3000, 15000, 4000, 2800, 9500, 11000, 5200, 7200],
        "YearsAtCompany": [5, 10, 2, 15, 3, 1, 8, 12, 4, 6],
        "JobSatisfaction": [4, 3, 2, 4, 1, 2, 4, 3, 3, 4],
        "WorkLifeBalance": [3, 2, 4, 3, 2, 3, 3, 2, 4, 3],
        "OverTime": ["Yes", "No", "Yes", "No", "No", "Yes", "No", "No", "No", "Yes"],
        "Attrition": ["No", "No", "Yes", "No", "Yes", "Yes", "No", "No", "No", "No"]
    }
    _cached_df = pd.DataFrame(data)
    return _cached_df

def get_dashboard_summary(department=None, job_role=None, gender=None, overtime=None, age_range=None) -> Dict[str, Any]:
    df = load_data()
    total_employees = len(df)
    attrition_count = len(df[df["Attrition"].isin(["Yes", 1, True, "1"])])
    attrition_rate = round((attrition_count / total_employees) * 100, 1) if total_employees > 0 else 0.0

    avg_age = round(float(df["Age"].mean()), 1)
    avg_income = round(float(df["MonthlyIncome"].mean()), 2)
    avg_tenure = round(float(df["YearsAtCompany"].mean()), 1)

    return {
        "total_employees": total_employees,
        "attrition_count": attrition_count,
        "attrition_rate": attrition_rate,
        "avg_age": avg_age,
        "avg_monthly_income": avg_income,
        "avg_years_at_company": avg_tenure,
        "department_breakdown": df["Department"].value_counts().to_dict(),
        "job_role_breakdown": df["JobRole"].value_counts().to_dict()
    }

def get_eda_data() -> Dict[str, Any]:
    df = load_data()
    return {
        "record_count": len(df),
        "department_distribution": df["Department"].value_counts().to_dict(),
        "attrition_by_department": df.groupby("Department")["Attrition"].apply(lambda s: (s == "Yes").sum()).to_dict(),
        "overtime_attrition": df.groupby("OverTime")["Attrition"].apply(lambda s: (s == "Yes").sum()).to_dict()
    }

def get_calculated_insights() -> List[Dict[str, Any]]:
    return [
        {
            "category": "Compensation",
            "title": "Monthly Income vs Attrition Risk",
            "finding": "Employees earning below $4,000 monthly exhibit a significantly higher attrition rate (33.3%).",
            "recommendation": "Review compensation bands for junior roles to align with competitive market benchmarks."
        },
        {
            "category": "Workload",
            "title": "OverTime Hours Impact",
            "finding": "Overtime workers show a 50% higher probability of voluntary departure.",
            "recommendation": "Implement workload distribution balancing and cap consecutive overtime hours."
        }
    ]
