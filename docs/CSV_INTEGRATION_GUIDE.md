# CSV Handling Integration Guide

## Quick Start

This guide helps you integrate the CSV handling system into the existing FastAPI application.

## Step 1: Add CSV Routes to Main API

Edit `backend/jwt.py` and add the following imports at the top:

```python
from csv_routes import router as csv_router
```

Then, after the app initialization (around line 20), add:

```python
# Include CSV routes
app.include_router(csv_router)
```

## Step 2: Verify Database Models

The system expects a `Product` model in `dbmodel.py`. Verify it has these fields:

```python
class Product(Base):
    __tablename__ = 'product_1'
    EFTREFNUMBER = Column(String, primary_key=True, index=True, unique=True)
    CRACCOUNTTITLE = Column(String)
    CRACCOUNTTYPE = Column(String)
    CRACCOUNTNO = Column(String, unique=True)
    CRROUTINGNO = Column(String)
    CRAMOUNT = Column(Float)
    BENEFICIARY_ID = Column(String, unique=True)
    MOBILE = Column(String, unique=True)
    NID_NO = Column(String, unique=True)
    MIN_CODE = Column(String)
    DEPT_CODE = Column(String)
    PAYMENT_CYCLE_NAME_EN = Column(String)
    SCHEME_CODE = Column(String)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

## Step 3: Update Permissions (if not already present)

In `backend/rbac.py`, verify that `Permission` enum includes:

```python
class Permission(Enum):
    # CSV Operations
    UPLOAD_CSV = "upload_csv"
    PROCESS_VALID_ROWS = "process_valid_rows"
    # ... other permissions
```

And verify Role permissions include CSV operations:

```python
ADMIN_PERMISSIONS = [
    # ... other permissions
    Permission.UPLOAD_CSV,
    Permission.PROCESS_VALID_ROWS,
]

MANAGER_PERMISSIONS = [
    # ... other permissions
    Permission.UPLOAD_CSV,
    Permission.PROCESS_VALID_ROWS,
]
```

## Step 4: Add Frontend HTML Component

1. Add `frontend/csv-upload.html` to your frontend directory
2. Link it from `frontend/index.html`:

```html
<a href="csv-upload.html" class="menu-item">
    <i class="fas fa-file-csv"></i> CSV Upload
</a>
```

## Step 5: Update Frontend JavaScript

Ensure your `frontend/header.js` and `frontend/sidebar.js` are properly configured. These files should:

- Load user information from localStorage
- Handle logout functionality
- Navigate between pages

## Step 6: Test the Integration

### Test 1: File Upload
```bash
curl -X POST "http://localhost:8000/api/csv/validate?user_id=1" \
  -F "file=@test.csv"
```

### Test 2: Process Batch
```bash
curl -X POST "http://localhost:8000/api/csv/process-batch?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{"rows": [{"EFTREFNUMBER": "REF001", ...}]}'
```

## API Endpoints Reference

### 1. Validate CSV
**Endpoint**: `POST /api/csv/validate`

**Parameters**:
- `file`: CSV file (multipart/form-data)
- `user_id`: User ID (optional, for permission check)

**Returns**:
```json
{
  "valid": boolean,
  "file_name": "string",
  "total_rows": number,
  "valid_rows": number,
  "invalid_rows": number,
  "errors": ["string"],
  "invalid_row_details": [{"row": number, "error": "string"}]
}
```

### 2. Upload and Process CSV
**Endpoint**: `POST /api/csv/upload`

**Parameters**:
- `file`: CSV file (multipart/form-data)
- `user_id`: User ID (optional, for permission check)

**Returns**:
```json
{
  "success": boolean,
  "success_count": number,
  "error_count": number,
  "total_processed": number,
  "report": {
    "generated_at": "string",
    "file_name": "string",
    "statistics": {
      "total_rows": number,
      "valid_rows": number,
      "invalid_rows": number,
      "success_rate": "string"
    }
  }
}
```

### 3. Process Batch (Client-Validated Rows)
**Endpoint**: `POST /api/csv/process-batch`

**Parameters**:
- `rows`: Array of validated row objects
- `user_id`: User ID (optional, for permission check)

**Body**:
```json
{
  "rows": [
    {
      "EFTREFNUMBER": "REF001",
      "CRACCOUNTTITLE": "John Doe",
      "CRACCOUNTTYPE": "Savings",
      "CRACCOUNTNO": "1234567890",
      "CRROUTINGNO": "100",
      "CRAMOUNT": 50000.0,
      "BENEFICIARY_ID": "BID001",
      "MOBILE": "01712345678",
      "NID_NO": "1234567890123456",
      "MIN_CODE": "MOD001",
      "DEPT_CODE": "DEPT001",
      "PAYMENT_CYCLE_NAME_EN": "Monthly",
      "SCHEME_CODE": "SC001"
    }
  ]
}
```

**Returns**:
```json
{
  "success": boolean,
  "totalValid": number,
  "totalInvalid": number,
  "message": "string",
  "errors": ["string"] or null
}
```

## Frontend Integration Details

### Using the CSV Upload Component

The `csv-upload.html` file is a complete, standalone HTML page with:

1. **Drag-and-Drop Upload**
   - Users can drag files directly onto the upload box
   - Visual feedback during drag operation

2. **File Selection**
   - Click button to browse and select CSV file
   - File type validation (CSV only)

3. **Client-Side Validation**
   - Validates headers and column names
   - Validates data types and ranges
   - Detects duplicates within the file

4. **Validation Report Modal**
   - Shows summary statistics
   - Lists invalid rows with error reasons
   - Options to download error report or process valid rows

5. **Error Report Generation**
   - Downloads error report as CSV file
   - Includes row numbers, validation status, and error messages
   - Timestamped file names

### JavaScript API

The HTML file exposes these JavaScript functions:

```javascript
// Upload a file
handleFileUpload(file)

// Show validation report
showValidationReport(fileName, totalRows, validCount, invalidCount)

// Close the validation modal
closeModal()

// Download error report
downloadErrorReport()

// Process valid rows
processValidRows()

// Show alert message
showAlert(message, type)  // type: 'success', 'error', 'info'

// Reset upload box
resetUploadBox()
```

## Backend Integration Details

### Using CSV Handler Classes

#### CSVValidator

```python
from csv_handler import CSVValidator

validator = CSVValidator(csv_text)

# Validate headers
if not validator.validate_headers():
    print(validator.errors)

# Validate rows
valid_rows, invalid_rows = validator.validate_rows()

# Check duplicates
csv_dups = validator.check_duplicates_in_csv(valid_rows)
db_dups = validator.check_duplicates_in_db(valid_rows)
```

#### CSVProcessor

```python
from csv_handler import CSVProcessor

success_count, error_count, errors = CSVProcessor.process_rows(valid_rows)
print(f"Success: {success_count}, Errors: {error_count}")
```

#### CSVReportGenerator

```python
from csv_handler import CSVReportGenerator

# Generate summary
report = CSVReportGenerator.generate_summary_report(
    total=100,
    valid=98,
    invalid=2,
    file_name="data.csv"
)

# Generate error report
error_report = CSVReportGenerator.generate_error_report(headers, rows)
```

## Troubleshooting Integration

### Problem: Module import errors
**Solution**: Ensure `csv_handler.py` and `csv_routes.py` are in the `backend/` directory

### Problem: Permission denied errors
**Solution**: Verify user role has UPLOAD_CSV permission in `rbac.py`

### Problem: Database constraint errors
**Solution**: Check for duplicate values in unique columns (EFTREFNUMBER, CRACCOUNTNO, BENEFICIARY_ID, MOBILE)

### Problem: CORS errors on frontend
**Solution**: Verify CORS middleware is enabled in `jwt.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Example Complete Integration

Here's how your `backend/jwt.py` main section should look:

```python
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# ... other imports ...

from csv_routes import router as csv_router  # Add this import

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# Include routers
app.include_router(csv_router)  # Add CSV routes

# ... rest of your endpoints ...
```

## File Checklist

- [ ] `backend/csv_handler.py` created
- [ ] `backend/csv_routes.py` created
- [ ] `frontend/csv-upload.html` created
- [ ] `backend/jwt.py` updated with csv_routes import and include_router
- [ ] `backend/rbac.py` verified with UPLOAD_CSV and PROCESS_VALID_ROWS permissions
- [ ] `backend/dbmodel.py` verified with Product model
- [ ] Database tables created (run `create_tables.py`)
- [ ] Frontend tested with sample CSV file

## Next Steps

1. **Test CSV Upload**: Use the provided test CSV files to verify functionality
2. **Monitor Logs**: Check for any errors during processing
3. **Update Documentation**: Add CSV handling info to user guides
4. **Set Permissions**: Configure appropriate permissions for different user roles
5. **Backup Database**: Before processing large CSV files

## Support

For issues or questions, refer to:
- `docs/CSV_HANDLING_DOCUMENTATION.md` - Complete documentation
- `backend/csv_handler.py` - Source code and class documentation
- `frontend/csv-upload.html` - Frontend implementation details
