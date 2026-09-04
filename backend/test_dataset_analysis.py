import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_dataset_analysis_without_attrition():
    print("--- Test 1: Dataset WITHOUT Attrition Target Column ---")
    csv_data = """EMPLOYEE_ID,FIRST_NAME,LAST_NAME,EMAIL,PHONE_NUMBER,HIRE_DATE,JOB_ID,SALARY,MANAGER_ID,DEPARTMENT_ID
1,John,Doe,john.doe@enterprise.com,555-0192,2020-01-15,DEV,85000,10,2
2,Jane,Smith,jane.smith@enterprise.com,555-0193,2019-03-12,MGR,120000,0,2
3,Bob,Johnson,bob.j@enterprise.com,555-0194,2021-06-01,DEV,65000,10,2
4,Alice,Williams,alice.w@enterprise.com,555-0195,2018-09-20,DIR,175000,0,1
5,Charlie,Brown,charlie.b@enterprise.com,555-0296,2022-02-10,DEV,55000,10,2
"""
    files = {'file': ('company_employees.csv', csv_data.encode('utf-8'), 'text/csv')}
    mappings = {
        "MonthlyIncome": "SALARY",
        "Department": "DEPARTMENT_ID",
        "JobRole": "JOB_ID"
    }
    data = {
        'mappings': json.dumps(mappings),
        'target_column': 'none'
    }

    resp = requests.post(f"{BASE_URL}/dataset/analyze", files=files, data=data)
    print(f"Status Code: {resp.status_code}")
    res = resp.json()
    print(f"Row Count: {res.get('row_count')}")
    print(f"Has Attrition: {res.get('has_attrition')}")
    print(f"Salary Analytics Available: {res.get('salary_analytics', {}).get('available')}")
    print(f"Avg Salary: {res.get('salary_analytics', {}).get('avg_salary')}")
    print(f"Age Analytics Available: {res.get('age_analytics', {}).get('available')}")
    print(f"PII Columns Masked/Excluded: {res.get('pii_columns')}")
    assert resp.status_code == 200
    assert res.get('has_attrition') == False
    assert res.get('salary_analytics', {}).get('avg_salary') == 100000.0
    print("Test 1 Passed Successfully!\n")

def test_dataset_analysis_with_attrition():
    print("--- Test 2: Dataset WITH Attrition Target Column ---")
    csv_data = """EmpID,Age,Salary,Department,Left
101,28,4500,Sales,1
102,42,12000,Engineering,0
103,35,7500,Sales,0
104,24,3200,Marketing,1
105,50,15000,Executive,0
"""
    files = {'file': ('historical_turnover.csv', csv_data.encode('utf-8'), 'text/csv')}
    mappings = {
        "Age": "Age",
        "MonthlyIncome": "Salary",
        "Department": "Department"
    }
    data = {
        'mappings': json.dumps(mappings),
        'target_column': 'Left'
    }

    resp = requests.post(f"{BASE_URL}/dataset/analyze", files=files, data=data)
    print(f"Status Code: {resp.status_code}")
    res = resp.json()
    print(f"Has Attrition: {res.get('has_attrition')}")
    print(f"Attrition Target Column: {res.get('attrition_column')}")
    print(f"Avg Age: {res.get('age_analytics', {}).get('avg_age')}")
    assert resp.status_code == 200
    assert res.get('has_attrition') == True
    assert res.get('attrition_column') == 'Left'
    assert res.get('age_analytics', {}).get('avg_age') == 35.8
    print("Test 2 Passed Successfully!\n")

def test_company_analytics_get():
    print("--- Test 3: GET /api/dataset/company-analytics ---")
    csv_data = "EmpID,Salary\n1,5000\n2,6000\n"
    files = {'file': ('company_test.csv', csv_data.encode('utf-8'), 'text/csv')}
    requests.post(f"{BASE_URL}/dataset/analyze", files=files, data={'mappings': '{}', 'target_column': 'none'})

    resp = requests.get(f"{BASE_URL}/dataset/company-analytics")
    print(f"Status Code: {resp.status_code}")
    res = resp.json()
    print(f"Active Filename: {res.get('filename')}")
    assert resp.status_code == 200
    assert res.get('filename') == 'company_test.csv'
    print("Test 3 Passed Successfully!\n")

if __name__ == "__main__":
    test_dataset_analysis_without_attrition()
    test_dataset_analysis_with_attrition()
    test_company_analytics_get()
