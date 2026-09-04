import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.services.ml_service import load_or_train_model

app = FastAPI(
    title="Employee Attrition Intelligence API",
    description="FastAPI Backend for Employee Attrition Machine Learning Analytics & Prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def startup_event():
    print("Initializing Employee Attrition Intelligence API...")
    try:
        artifact = load_or_train_model()
        print(f"ML Models trained/loaded successfully! Best model: {artifact['best_model_name']}")
    except Exception as e:
        print(f"Warning on startup model loading: {e}")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
