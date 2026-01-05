# CSV Handling System - Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
│                   (csv-upload.html)                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SELECT/DRAG CSV FILE                                    │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Drag & Drop Zone or Browse Files                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CLIENT-SIDE VALIDATION                                 │   │
│  │  • Check headers                                        │   │
│  │  • Validate rows                                        │   │
│  │  • Check duplicates                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  VALIDATION REPORT MODAL                                │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │ Total: 100 | Valid: 98 | Invalid: 2                ││   │
│  │  │ [Download Report] [Process Valid] [Cancel]         ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ↓                                      ↓
    ┌─────────────────┐              ┌─────────────────┐
    │ DOWNLOAD REPORT │              │ PROCESS ROWS    │
    │   (Error CSV)   │              │  (to Database)  │
    └─────────────────┘              └─────────────────┘
                                             ↓
                    ┌────────────────────────────────────────┐
                    │        API ENDPOINT                    │
                    │  /api/csv/process-batch               │
                    └────────────────────────────────────────┘
                                    ↓
                    ┌────────────────────────────────────────┐
                    │   BACKEND (csv_handler.py)            │
                    │                                        │
                    │  ┌──────────────────────────────────┐ │
                    │  │ CSVValidator                     │ │
                    │  │ • validate_headers()             │ │
                    │  │ • validate_rows()                │ │
                    │  │ • check_duplicates_in_csv()      │ │
                    │  │ • check_duplicates_in_db()       │ │
                    │  └──────────────────────────────────┘ │
                    │                                        │
                    │  ┌──────────────────────────────────┐ │
                    │  │ CSVProcessor                     │ │
                    │  │ • process_rows()                 │ │
                    │  │ • insert into database           │ │
                    │  └──────────────────────────────────┘ │
                    │                                        │
                    │  ┌──────────────────────────────────┐ │
                    │  │ CSVReportGenerator               │ │
                    │  │ • generate_error_report()        │ │
                    │  │ • generate_summary_report()      │ │
                    │  └──────────────────────────────────┘ │
                    └────────────────────────────────────────┘
                                    ↓
                    ┌────────────────────────────────────────┐
                    │       DATABASE (SQLAlchemy)           │
                    │                                        │
                    │  ┌──────────────────────────────────┐ │
                    │  │ Product Table                    │ │
                    │  │ • EFTREFNUMBER (PK, Unique)     │ │
                    │  │ • CRACCOUNTTITLE                │ │
                    │  │ • CRACCOUNTTYPE                 │ │
                    │  │ • CRACCOUNTNO (Unique)          │ │
                    │  │ • CRROUTINGNO                   │ │
                    │  │ • CRAMOUNT                      │ │
                    │  │ • BENEFICIARY_ID (Unique)       │ │
                    │  │ • MOBILE (Unique)               │ │
                    │  │ • NID_NO (Optional, Unique)     │ │
                    │  │ • MIN_CODE (Optional)           │ │
                    │  │ • DEPT_CODE (Optional)          │ │
                    │  │ • PAYMENT_CYCLE_NAME_EN         │ │
                    │  │ • SCHEME_CODE                   │ │
                    │  │ • updated_at                    │ │
                    │  └──────────────────────────────────┘ │
                    └────────────────────────────────────────┘
                                    ↓
                    ┌────────────────────────────────────────┐
                    │       SUCCESS/ERROR RESPONSE           │
                    │                                        │
                    │  {                                     │
                    │    "success": true,                    │
                    │    "totalValid": 98,                   │
                    │    "totalInvalid": 2,                  │
                    │    "message": "Processed 98 records"   │
                    │  }                                     │
                    └────────────────────────────────────────┘
                                    ↓
                    ┌────────────────────────────────────────┐
                    │      DISPLAY RESULTS TO USER           │
                    │      (csv-upload.html)                 │
                    └────────────────────────────────────────┘
```

## Data Flow Diagram

```
CSV File
   ↓
┌──────────────────┐
│ File Upload      │
│ (Browser)        │
└──────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Client-Side Validation               │
├──────────────────────────────────────┤
│ 1. Read CSV text                     │
│ 2. Parse headers                     │
│ 3. Validate required columns         │
│ 4. Validate each row:                │
│    - Required fields present?        │
│    - Data types correct?             │
│    - Values in valid range?          │
│    - Format valid?                   │
│ 5. Check duplicates in file          │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Split Valid & Invalid Rows           │
├──────────────────────────────────────┤
│ Valid Rows:   [row1, row2, ...]      │
│ Invalid Rows: [row3, row5, ...]      │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Generate Validation Report           │
├──────────────────────────────────────┤
│ Total:   100                         │
│ Valid:   98                          │
│ Invalid: 2                           │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ User Chooses Action                  │
├──────────────────────────────────────┤
│ ├─→ Download Error Report (CSV)      │
│ └─→ Process Valid Rows               │
│        ↓                              │
│    Send to Backend API               │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Backend Processing (csv_handler.py)  │
├──────────────────────────────────────┤
│ 1. Receive valid rows JSON           │
│ 2. Check database for duplicates     │
│ 3. For each row:                     │
│    - Create Product object           │
│    - Add to database session         │
│    - Commit (or rollback on error)   │
│ 4. Track success/error counts        │
│ 5. Return results                    │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Database (SQLite/PostgreSQL/MySQL)   │
├──────────────────────────────────────┤
│ INSERT INTO product_1                │
│ (EFTREFNUMBER, CRACCOUNTTITLE, ...)  │
│ VALUES (?, ?, ...)                   │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Return Result to Frontend            │
├──────────────────────────────────────┤
│ {                                    │
│   "success": true,                   │
│   "totalValid": 98,                  │
│   "totalInvalid": 0                  │
│ }                                    │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Display Success Message              │
├──────────────────────────────────────┤
│ ✓ Successfully imported 98 records    │
└──────────────────────────────────────┘
```

## CSV Validation Flowchart

```
START: CSV File Received
   ↓
   ┌─────────────────────────────┐
   │ Check file extension        │
   │ Must be .csv                │
   └─────────────────────────────┘
   ↓ (Yes)
   ┌─────────────────────────────┐
   │ Read file as text           │
   │ Split into lines            │
   └─────────────────────────────┘
   ↓
   ┌─────────────────────────────┐
   │ Parse header row            │
   │ Extract column names        │
   └─────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────────────┐
   │ Check required columns                          │
   │ EFTREFNUMBER, CRACCOUNTTITLE, CRACCOUNTTYPE,   │
   │ CRACCOUNTNO, CRROUTINGNO, CRAMOUNT,            │
   │ BENEFICIARY_ID, MOBILE                         │
   └─────────────────────────────────────────────────┘
   ↓ (All exist: Yes)
   ┌─────────────────────────────┐
   │ For each data row:          │
   │ - Read columns              │
   │ - Check required fields     │
   │ - Validate data types       │
   │ - Validate ranges           │
   │ - Check formats             │
   └─────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────────────┐
   │ Build Result Arrays:                            │
   │ - validRows: []                                 │
   │ - invalidRows: []                               │
   │ For each row:                                   │
   │   if all validations pass:                      │
   │     add to validRows                            │
   │   else:                                         │
   │     add to invalidRows with error message       │
   └─────────────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────────────┐
   │ Check Duplicates in CSV:                        │
   │ For each unique column (EFTREFNUMBER, etc):     │
   │   check if value appears more than once         │
   │   if yes: mark as error                         │
   └─────────────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────────────┐
   │ Check Duplicates in Database:                   │
   │ For each unique column:                         │
   │   Query database for existing values            │
   │   if found: mark as error                       │
   └─────────────────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────────────────┐
   │ Generate Report:                                │
   │ - Total rows processed                          │
   │ - Valid rows count                              │
   │ - Invalid rows count                            │
   │ - Detailed error messages for each invalid row  │
   └─────────────────────────────────────────────────┘
   ↓
   RETURN: Validation Report
```

## File Organization

```
PROJECT ROOT
│
├── backend/
│   ├── csv_handler.py ..................... CSV Validation & Processing
│   ├── csv_routes.py ....................... API Endpoints
│   ├── jwt.py ............................. Main FastAPI Application
│   ├── dbmodel.py .......................... Database Models (Product, User, etc)
│   ├── database.py ......................... Database Configuration
│   ├── rbac.py ............................ Role-Based Access Control
│   ├── model.py ........................... Pydantic Schemas
│   ├── run_api.py ......................... API Runner
│   └── app.db ............................. SQLite Database
│
├── frontend/
│   ├── csv-upload.html .................... CSV Upload Page
│   ├── sample_data.csv .................... Test Data (10 records)
│   ├── index.html ......................... Dashboard (link to CSV upload)
│   ├── header.html/js ..................... Header Component
│   ├── sidebar.html/js .................... Sidebar Navigation
│   ├── admin-dashboard.html ............... Admin Panel
│   ├── report.html ........................ Reports
│   └── admin_profile.html/css/js ......... Profile Page
│
└── docs/
    ├── CSV_FILE_MANIFEST.md .............. This File List
    ├── CSV_HANDLING_DOCUMENTATION.md ..... Complete Documentation
    ├── CSV_INTEGRATION_GUIDE.md .......... Integration Steps
    ├── CSV_IMPLEMENTATION_SUMMARY.md ..... What Was Implemented
    ├── CSV_QUICK_REFERENCE.md ........... Quick Reference
    └── README.md ......................... Project README
```

## Validation Rules Matrix

```
┌──────────────────┬────────────┬──────────────┬──────────────────────┐
│ Column           │ Required   │ Unique       │ Validation Rules     │
├──────────────────┼────────────┼──────────────┼──────────────────────┤
│ EFTREFNUMBER     │ YES        │ YES          │ Not empty, unique    │
│ CRACCOUNTTITLE   │ YES        │ NO           │ Not empty            │
│ CRACCOUNTTYPE    │ YES        │ NO           │ Not empty            │
│ CRACCOUNTNO      │ YES        │ YES          │ Not empty, unique    │
│ CRROUTINGNO      │ YES        │ NO           │ Not empty            │
│ CRAMOUNT         │ YES        │ NO           │ Numeric, > 0         │
│ BENEFICIARY_ID   │ YES        │ YES          │ Not empty, unique    │
│ MOBILE           │ YES        │ YES          │ 10+ digits, unique   │
├──────────────────┼────────────┼──────────────┼──────────────────────┤
│ NID_NO           │ NO         │ YES          │ Unique (if provided) │
│ MIN_CODE         │ NO         │ NO           │ None                 │
│ DEPT_CODE        │ NO         │ NO           │ None                 │
│ PAYMENT_CYCLE... │ NO         │ NO           │ None                 │
│ SCHEME_CODE      │ NO         │ NO           │ None                 │
└──────────────────┴────────────┴──────────────┴──────────────────────┘
```

## API Endpoint Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ METHOD │ ENDPOINT                 │ PERMISSION        │ PURPOSE  │
├─────────────────────────────────────────────────────────────────┤
│ POST   │ /api/csv/validate        │ UPLOAD_CSV        │ Validate │
│        │ ?user_id=1               │                   │ only     │
├─────────────────────────────────────────────────────────────────┤
│ POST   │ /api/csv/upload          │ UPLOAD_CSV        │ Validate │
│        │ ?user_id=1               │                   │ & Process│
├─────────────────────────────────────────────────────────────────┤
│ POST   │ /api/csv/process-batch   │ PROCESS_VALID_    │ Process  │
│        │ ?user_id=1               │ ROWS              │ rows     │
├─────────────────────────────────────────────────────────────────┤
│ GET    │ /api/csv/download-       │ None              │ Get      │
│        │ template                 │                   │ template │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Uploads CSV
   ↓
Validation fails
   ↓
┌─────────────────────────────────────────┐
│ Determine Error Type                    │
├─────────────────────────────────────────┤
│ ├─ Missing Column           → Return 400
│ ├─ Empty Required Field     → Add to invalid rows
│ ├─ Invalid Data Type        → Add to invalid rows
│ ├─ Invalid Value Range      → Add to invalid rows
│ ├─ Invalid Format           → Add to invalid rows
│ ├─ Duplicate in File        → Return error
│ └─ Duplicate in Database    → Return error
└─────────────────────────────────────────┘
   ↓
Generate Error Report
   ↓
┌─────────────────────────────────────────┐
│ Error Report Contains:                  │
│ - Row number with error                 │
│ - Original data                         │
│ - Specific error message                │
│ - Can be downloaded as CSV              │
└─────────────────────────────────────────┘
   ↓
User can:
├─ Fix errors and re-upload
├─ Download report for analysis
└─ Process valid rows anyway
```

## Status Indicators

```
Upload States:
┌──────────────────┐
│ Uploading...     │ 🔄 Spinner animation
└──────────────────┘
        ↓
┌──────────────────┐
│ Validating...    │ 🔄 Spinner animation
└──────────────────┘
        ↓
┌──────────────────┐
│ Processing...    │ 🔄 Spinner animation
└──────────────────┘
        ↓
┌──────────────────────┐
│ ✓ Success            │ 🟢 Green color
└──────────────────────┘
   OR
┌──────────────────────┐
│ ✗ Error              │ 🔴 Red color
└──────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────┐
│   csv-upload.   │
│      html       │
│                 │
│ ┌─────────────┐ │
│ │ Upload Box  │ │
│ │(Drag/Drop)  │ │
│ └─────────────┘ │
│        ↓        │
│ ┌─────────────┐ │
│ │ Validation  │ │
│ │  (JS)       │ │
│ └─────────────┘ │
│        ↓        │
│ ┌─────────────┐ │
│ │ Modal       │ │
│ │ (Report)    │ │
│ └─────────────┘ │
│        ↓        │
│ Download or    │
│ Send to API    │
└────────┬────────┘
         │
         ├──────────────────┐
         ↓                  ↓
    ┌─────────┐        ┌─────────┐
    │ Download│        │  POST   │
    │ Report  │        │   API   │
    └─────────┘        └────┬────┘
                            ↓
                    ┌──────────────┐
                    │ csv_routes.  │
                    │     py       │
                    └────┬─────────┘
                         ↓
                    ┌──────────────┐
                    │  csv_handler │
                    │     .py      │
                    └────┬─────────┘
                         ↓
                    ┌──────────────┐
                    │  Database    │
                    │  (SQLAlchemy)│
                    └──────────────┘
```

---

**Visual Guide for CSV Handling System**  
*Created: December 30, 2025*
