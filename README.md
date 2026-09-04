# 🚀 Employee Attrition Intelligence Platform

An end-to-end HR analytics and predictive intelligence platform designed to help organizations understand employee attrition, explore workforce patterns, and generate data-driven HR insights.

## 📊 Overview

The Employee Attrition Intelligence Platform combines **data analytics, interactive dashboards, exploratory data analysis, and machine learning** into a single web application.

The platform allows HR teams and business users to:

- 📈 Monitor workforce metrics
- 👥 Analyze employee demographics
- 💰 Explore salary and compensation patterns
- 🏢 Analyze departments and job roles
- ⏱️ Study employee tenure and overtime
- 📊 Perform exploratory data analysis
- 🤖 Predict employee attrition
- 💡 Generate actionable HR insights
- 📁 Upload and analyze custom employee datasets

---

## ✨ Key Features

### 📌 Executive HR Dashboard
Provides an overview of important workforce KPIs:

- Total Employees
- Employees Left
- Attrition Rate
- Average Monthly Income
- Average Employee Age
- Department-wise Attrition
- Overtime Analysis
- Job Role Distribution
- Salary Distribution

### 📈 Exploratory Data Analysis

Interactive analysis of employee data including:

- Age distribution
- Salary distribution
- Department analysis
- Job role analysis
- Overtime patterns
- Employee tenure
- Attrition-related patterns

### 🤖 Employee Attrition Predictor

The platform provides an individual employee attrition prediction interface using relevant employee attributes.

It is designed to help HR teams identify employees who may have a higher risk of leaving and support early intervention.

### 📂 Dynamic Dataset Upload

Users can upload CSV/Excel employee datasets.

The system analyzes the uploaded dataset and dynamically identifies relevant columns for workforce analytics.

### 🧠 Smart Column Mapping

The application maps uploaded dataset columns to standardized HR fields such as:

- Monthly Income / Salary
- Department
- Job Role
- Hire Date
- Employee Age
- Overtime
- Years at Company
- Job Satisfaction

This allows datasets with different column names to be analyzed more easily.

### 💡 Business Insights

The platform converts analytical results into understandable HR insights that can help organizations identify potential workforce risks and opportunities.

---

## 🛠️ Technology Stack

### Frontend
- React
- JavaScript
- HTML
- CSS
- Interactive Charts

### Backend
- Python
- FastAPI
- REST APIs

### Data Science & Machine Learning
- Pandas
- NumPy
- Scikit-learn
- Exploratory Data Analysis
- Machine Learning

### Development Tools
- Visual Studio Code
- Git
- GitHub

## 🏗️ Project Architecture

```text
Employee-Attrition-Intelligence-Platform/
│
├── backend/
│   ├── app/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   └── ...
│   └── ...
│
├── .gitignore
└── README.md


🔄 Application Workflow

        Employee Dataset
              │
              ▼
       Dataset Upload
              │
              ▼
     Data Validation & Analysis
              │
              ▼
      Smart Column Mapping
              │
       ┌──────┴──────┐
       ▼             ▼
   HR Analytics   Machine Learning
       │             │
       ▼             ▼
  Dashboards     Attrition Prediction
       │             │
       └──────┬──────┘
              ▼
       Business Insights


🚀 Getting Started :
 
1. Clone the Repository
git clone https://github.com/rkhandekar364-cell/Employee-Attrition-Intelligence-Platform.git
cd Employee-Attrition-Intelligence-Platform
2. Backend Setup

Navigate to the backend:

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the FastAPI server:

uvicorn app.main:app --reload
3. Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Open the local URL displayed by Vite in your browser.

📁 Dataset

The application supports employee datasets in:

CSV
Excel (.xlsx)

For best results, datasets should contain relevant employee attributes such as salary, department, job role, age, overtime, tenure, and employee satisfaction.

⚠️ Do not upload confidential or personally identifiable employee information.


🎯 Project Objectives

The main objectives of this project are:

Build an interactive HR analytics platform.
Analyze employee workforce patterns.
Identify factors associated with employee attrition.
Apply machine learning for attrition prediction.
Provide understandable business insights.
Support custom dataset analysis.
Demonstrate an end-to-end Data Science application.


🔮 Future Improvements
Real-time HR analytics
Advanced ML models
Model explainability using SHAP
Automated PDF reports
Advanced employee risk scoring
Role-specific retention recommendations
Cloud deployment
Authentication and role-based access
Database integration
Larger enterprise datasets


👨‍💻 Author

Rohit Khandekar

B.Tech – Artificial Intelligence & Data Science

Interested in:

Data Science
Artificial Intelligence
Machine Learning
Business Analytics
Full-Stack Data Applications


⭐ Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.

📄 License

This project is intended for educational and portfolio purposes.


### Then update GitHub

Since your repository is already connected, the easiest way is:

