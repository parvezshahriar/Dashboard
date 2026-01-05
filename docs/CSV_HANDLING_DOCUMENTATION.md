# CSV File Handling Implementation

## Overview
This document describes the CSV file handling system implemented in the Government Disbursement Portal. The system provides comprehensive CSV validation, processing, and error reporting capabilities.

## Architecture

### Components

#### 1. Frontend Component (`csv-upload.html`)
- **Location**: `frontend/csv-upload.html`
- **Features**:
  - Drag-and-drop file upload interface
  - Client-side CSV validation
  - Real-time error detection
  - Validation report generation
  - Error report download in CSV format
  - Process valid rows after validation

#### 2. Backend Modules

##### CSV Handler Module (`csv_handler.py`)
- **Location**: `backend/csv_handler.py`
- **Classes**:
  - `CSVValidator`: Validates CSV structure and data
  - `CSVReportGenerator`: Generates validation and error reports
  - `CSVProcessor`: Processes and inserts data into database

##### CSV Routes Module (`csv_routes.py`)
- **Location**: `backend/csv_routes.py`
- **Endpoints**:
  - `POST /api/csv/validate`: Validate CSV without processing
  - `POST /api/csv/upload`: Upload and process CSV
  - `POST /api/csv/process-batch`: Process pre-validated rows
  - `GET /api/csv/download-template`: Download CSV template

## Data Schema

### Required Columns
| Column | Type | Description |
|--------|------|-------------|
| EFTREFNUMBER | String | EFT Reference Number (unique) |
| CRACCOUNTTITLE | String | Account Title |
| CRACCOUNTTYPE | String | Account Type |
| CRACCOUNTNO | String | Account Number (unique) |
| CRROUTINGNO | String | Routing Number |
| CRAMOUNT | Float | Disbursement Amount |
| BENEFICIARY_ID | String | Beneficiary ID (unique) |
| MOBILE | String | Mobile Number (unique) |

### Optional Columns
| Column | Type | Description |
|--------|------|-------------|
| NID_NO | String | National ID Number (unique) |
| MIN_CODE | String | Ministry Code |
| DEPT_CODE | String | Department Code |
| PAYMENT_CYCLE_NAME_EN | String | Payment Cycle Name |
| SCHEME_CODE | String | Scheme Code |

## Validation Logic

### Header Validation
- Checks for presence of all required columns (case-insensitive)
- Returns error if any required column is missing

### Row Validation
- Validates each row for required field presence
- Validates data types (numeric for amounts)
- Validates amount > 0
- Validates mobile number format (minimum 10 digits)
- Returns specific error message for each validation failure

### Duplicate Detection
1. **CSV Internal Duplicates**: Checks for duplicate values within the same file
   - EFTREFNUMBER
   - CRACCOUNTNO
   - BENEFICIARY_ID
   - MOBILE

2. **Database Duplicates**: Checks against existing records in database
   - Prevents duplicate entries in the system
   - Returns specific duplicate information

## Usage

### Frontend Workflow

#### Step 1: Upload File
```javascript
1. Click "Select File" or drag-drop CSV file
2. File is validated automatically
3. Validation report modal appears
```

#### Step 2: Review Report
```
- Total rows in file
- Valid rows ready for processing
- Invalid rows with error reasons
- Option to download error report
```

#### Step 3: Process or Download Report
```
Option A: Process Valid Rows
- Click "Process Valid Rows" button
- Valid rows are sent to backend
- Results displayed in success/error message

Option B: Download Error Report
- Click "Download Report" button
- CSV file generated with:
  - Row ID
  - Original data
  - Validation status
  - Error messages
```

### Backend Integration

#### Adding to FastAPI App
```python
from fastapi import FastAPI
from csv_routes import router as csv_router

app = FastAPI()
app.include_router(csv_router)
```

#### Using CSV Handler Directly
```python
from csv_handler import CSVValidator, CSVProcessor

# Validate CSV
validator = CSVValidator(csv_text)
if validator.validate_headers():
    valid_rows, invalid_rows = validator.validate_rows()

# Process valid rows
success_count, error_count, errors = CSVProcessor.process_rows(valid_rows)
```

## Error Handling

### Validation Errors
- Missing required columns
- Missing required field values
- Invalid data types
- Invalid amount values
- Invalid mobile format
- Duplicate data

### Processing Errors
- Database constraints
- Connection errors
- Data integrity issues

All errors are caught and reported with:
- Row number
- Specific error reason
- Full error details in logs

## Permissions

CSV operations require appropriate permissions:
- `UPLOAD_CSV`: Permission to upload and validate CSV files
- `PROCESS_VALID_ROWS`: Permission to process validated rows

Users with Admin or Manager roles have these permissions.

## API Examples

### Example 1: Validate CSV
```bash
curl -X POST "http://localhost:8000/api/csv/validate?user_id=1" \
  -F "file=@data.csv"
```

Response:
```json
{
  "valid": true,
  "file_name": "data.csv",
  "total_rows": 100,
  "valid_rows": 98,
  "invalid_rows": 2,
  "headers": ["EFTREFNUMBER", "CRACCOUNTTITLE", ...],
  "errors": [],
  "warnings": [],
  "invalid_row_details": [
    {
      "row": 15,
      "data": [...],
      "error": "Invalid amount (must be numeric)"
    }
  ]
}
```

### Example 2: Process Batch
```bash
curl -X POST "http://localhost:8000/api/csv/process-batch?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "EFTREFNUMBER": "REF001",
        "CRACCOUNTTITLE": "John Doe",
        ...
      }
    ]
  }'
```

Response:
```json
{
  "success": true,
  "totalValid": 98,
  "totalInvalid": 0,
  "message": "Processed 98 records successfully",
  "errors": null
}
```

## CSV Template Example

```csv
EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE,NID_NO,MIN_CODE,DEPT_CODE,PAYMENT_CYCLE_NAME_EN,SCHEME_CODE
REF001,John Doe,Savings,1234567890,100,50000,BID001,01712345678,1234567890123456,MOD001,DEPT001,Monthly,SC001
REF002,Jane Smith,Checking,9876543210,100,75000,BID002,01798765432,9876543210123456,MOD002,DEPT002,Quarterly,SC002
REF003,Ahmed Khan,Savings,5555555555,100,100000,BID003,01850000000,5555555555666666,MOD001,DEPT001,Monthly,SC001
```

## File Structure

```
Dashboard/
├── frontend/
│   ├── csv-upload.html          # CSV upload UI component
│   ├── header.html              # Header component
│   ├── sidebar.html             # Sidebar navigation
│   ├── header.js                # Header functionality
│   ├── sidebar.js               # Sidebar functionality
│   └── ...
├── backend/
│   ├── csv_handler.py           # CSV validation and processing
│   ├── csv_routes.py            # API endpoints
│   ├── jwt.py                   # Main API application
│   ├── dbmodel.py               # Database models
│   ├── database.py              # Database configuration
│   └── ...
└── ...
```

## Testing

### Test CSV Files

#### Valid CSV
```csv
EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE
REF001,John Doe,Savings,1234567890,100,50000,BID001,01712345678
```

#### Missing Required Field
```csv
EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE
REF001,John Doe,,1234567890,100,50000,BID001,01712345678
```
Expected Error: "Missing Account Type"

#### Invalid Amount
```csv
EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE
REF001,John Doe,Savings,1234567890,100,invalid,BID001,01712345678
```
Expected Error: "Invalid amount (must be numeric)"

#### Negative Amount
```csv
EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE
REF001,John Doe,Savings,1234567890,100,-50000,BID001,01712345678
```
Expected Error: "Amount must be greater than 0"

## Performance Considerations

- **File Size**: System can handle files with thousands of rows
- **Validation**: Client-side validation reduces server load
- **Database**: Batch insertion with transaction support for data integrity
- **Memory**: Efficient row-by-row processing prevents memory issues

## Security Features

1. **Permission Checks**: All endpoints verify user permissions
2. **Input Validation**: Strict validation of all CSV data
3. **SQL Injection Prevention**: Using ORM parameterized queries
4. **Authentication**: User ID verification on all operations
5. **Error Messages**: Safe error messages without sensitive information

## Maintenance

### Adding New Validation Rules
1. Modify `_validate_row()` in `CSVValidator` class
2. Add validation logic with clear error messages
3. Test with sample CSV files

### Modifying Column Requirements
1. Update `REQUIRED_COLUMNS` in `CSVValidator`
2. Update `OPTIONAL_COLUMNS` as needed
3. Update documentation

### Extending Functionality
- Add new report formats (Excel, PDF)
- Implement batch scheduling
- Add data transformation/mapping features
- Implement retry logic for failed rows

## Troubleshooting

### Issue: "Missing required columns"
**Solution**: Ensure CSV headers match exactly (case-insensitive but correct spelling)

### Issue: "Duplicate data found"
**Solution**: Remove duplicate rows or check database for existing records

### Issue: "Invalid amount"
**Solution**: Ensure amount column contains numeric values only

### Issue: "Invalid mobile number"
**Solution**: Ensure mobile numbers have at least 10 digits

## Future Enhancements

1. Support for multiple file formats (Excel, JSON)
2. Data transformation and mapping
3. Batch scheduling and automation
4. Email notifications for upload status
5. Advanced filtering and search in error reports
6. Data preview before processing
7. Rollback functionality for failed batches
8. Historical upload tracking and audit logs
