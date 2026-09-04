from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class EmployeePredictionInput(BaseModel):
    Age: Optional[int] = 35
    Department: Optional[str] = "Sales"
    JobRole: Optional[str] = "Sales Executive"
    MonthlyIncome: Optional[float] = 5000.0
    YearsAtCompany: Optional[int] = 5
    JobSatisfaction: Optional[int] = 3
    WorkLifeBalance: Optional[int] = 3
    OverTime: Optional[str] = "No"

class PredictionOutput(BaseModel):
    attrition_prediction: str
    attrition_probability: float
    risk_level: str
    message: Optional[str] = None

class SmartMappingResponse(BaseModel):
    filename: str
    row_count: int
    column_count: int
    data_quality_score: float
    detected_attrition_column: Optional[str] = None
    smart_mappings: Dict[str, str]
    missing_required_fields: List[str]
    columns_info: List[Dict[str, Any]]
    preview_data: List[Dict[str, Any]]
    column_names: List[str]
