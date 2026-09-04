from fastapi import APIRouter, Query, HTTPException, File, UploadFile, Form
import json
import io
import pandas as pd
from typing import Optional
from app.schemas.request_response import EmployeePredictionInput, PredictionOutput
from app.services.data_service import (
    get_dashboard_summary, 
    get_eda_data, 
    get_calculated_insights, 
    get_active_dataset_info, 
    reset_to_default_dataset
)
from app.services.ml_service import predict_attrition, load_or_train_model
from app.services.upload_service import analyze_uploaded_dataset, analyze_custom_dataset, get_current_company_analytics

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "Employee Attrition Intelligence API"}

@router.get("/dataset/active")
def get_active_dataset():
    return get_active_dataset_info()

@router.post("/dataset/reset")
def reset_dataset():
    return reset_to_default_dataset()

@router.get("/summary")
def get_summary(
    department: Optional[str] = Query(None),
    job_role: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    overtime: Optional[str] = Query(None),
    age_range: Optional[str] = Query(None)
):
    try:
        summary = get_dashboard_summary(department, job_role, gender, overtime, age_range)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/eda")
def get_eda():
    try:
        return get_eda_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
def get_model_metrics():
    try:
        artifact = load_or_train_model()
        if not artifact:
            return {"error": "Supervised model not trained"}
        return {
            "best_model_name": artifact["best_model_name"],
            "logistic_regression": artifact["lr_metrics"],
            "random_forest": artifact["rf_metrics"],
            "feature_importances": artifact["feature_importances"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
def get_insights():
    try:
        return {"insights": get_calculated_insights()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=PredictionOutput)
def predict(input_data: EmployeePredictionInput):
    try:
        result = predict_attrition(input_data.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        analysis = analyze_uploaded_dataset(contents, file.filename or "dataset.csv")
        return analysis
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing the file: {str(e)}")

@router.post("/dataset/analyze")
async def analyze_dataset_endpoint(
    file: UploadFile = File(...),
    mappings: str = Form("{}"),
    target_column: Optional[str] = Form(None)
):
    try:
        contents = await file.read()
        filename = file.filename or "Uploaded_Dataset.csv"
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        if ext in ['csv', 'tsv']:
            try:
                df = pd.read_csv(io.BytesIO(contents))
            except Exception:
                df = pd.read_csv(io.BytesIO(contents), encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        parsed_mappings = json.loads(mappings) if mappings else {}
        result = analyze_custom_dataset(df, parsed_mappings, target_column, filename)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze dataset: {str(e)}")

@router.get("/dataset/company-analytics")
def get_company_analytics():
    data = get_current_company_analytics()
    if not data:
        raise HTTPException(status_code=404, detail="No custom dataset analyzed yet.")
    return data
