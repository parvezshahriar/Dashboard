# Automated Batch Upload Process

## Overview
Every CSV file upload is automatically tracked in the `batch_upload` table. When a user uploads a CSV file, the system automatically:
1. Creates a batch upload record
2. Links all products to that batch
3. Calculates totals (amount, row count)
4. Updates batch status

---

## Automated Workflow

### 1. CSV File Upload Process

**Endpoint:** `POST /csv-upload`

**Flow:**
```
User uploads CSV
     ↓
POST /csv-upload (with file)
     ↓
Create BatchUpload record
  ├─ batch_name: "CSV_Upload_YYYYMMDD_HHMMSS"
  ├─ upload_date: NOW()
  ├─ status: "Pending"
  ├─ user_id: logged-in user
  └─ Get batch_id
     ↓
For each row in CSV:
  ├─ Create Product record
  ├─ Set batch_id from BatchUpload
  ├─ Calculate amounts
  └─ Insert to database
     ↓
Update BatchUpload with totals:
  ├─ total_rows: product count
  ├─ total_amount: sum of amounts
  └─ status: "Completed" or "Completed with Errors"
     ↓
Return response with batch_id, batch_name, success count
```

---

## API Endpoints

### 1. POST `/csv-upload` - Direct CSV Upload

**Request:**
```
POST /csv-upload?user_id=1
Content-Type: multipart/form-data

file: [CSV file]
```

**Automatic Actions:**
- ✅ Creates BatchUpload record
- ✅ Links all products to batch via `batch_id`
- ✅ Calculates totals automatically
- ✅ Updates status to "Completed"

**Response:**
```json
{
  "success_count": 100,
  "error_count": 0,
  "batch_id": 2,
  "batch_name": "CSV_Upload_20260101_153500",
  "message": "Processed 100 products successfully, 0 errors"
}
```

---

### 2. POST `/upload-batch` - Validated Row Upload

**Request:**
```
POST /upload-batch?user_id=1
Content-Type: application/json

{
  "rows": [
    {
      "EFTREFNUMBER": "REF001",
      "CRACCOUNTTITLE": "John Doe",
      ...
    }
  ]
}
```

**Automatic Actions:**
- ✅ Creates BatchUpload record
- ✅ Links all products to batch via `batch_id`
- ✅ Calculates totals automatically
- ✅ Updates status to "Completed"

**Response:**
```json
{
  "success_count": 50,
  "error_count": 0,
  "batch_id": 3,
  "batch_name": "Batch_Upload_20260101_153600",
  "message": "Processed 50 products successfully, 0 errors"
}
```

---

### 3. GET `/batch-uploads` - Retrieve All Batches

**Request:**
```
GET /batch-uploads?user_id=1
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "batch_name": "Initial_Load_20260101_153256",
    "upload_date": "01/01/2026 15:32:56",
    "total_rows": 1387,
    "total_amount": 7572457.55,
    "disbursed_amount": 0.0,
    "status": "Completed"
  },
  {
    "id": 2,
    "user_id": 1,
    "batch_name": "CSV_Upload_20260101_153500",
    "upload_date": "01/01/2026 15:35:00",
    "total_rows": 100,
    "total_amount": 500000.0,
    "disbursed_amount": 0.0,
    "status": "Completed"
  }
]
```

---

## Database Schema

### batch_upload Table

```sql
CREATE TABLE batch_upload (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER INDEX,
  batch_name VARCHAR(255) INDEX,
  upload_date DATETIME DEFAULT NOW(),
  total_rows INTEGER,
  total_amount FLOAT DEFAULT 0.0,
  disbursed_amount FLOAT DEFAULT 0.0,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW()
);
```

### product_1 Table (Updated)

```sql
ALTER TABLE product_1 ADD COLUMN batch_id INTEGER INDEX;
```

---

## Data Relationships

```
batch_upload (Parent)
    ↓
    └─→ product_1 (Child) - via batch_id foreign key
```

**Example:**
```
Batch 2 (CSV_Upload_20260101_153500)
├─ Product 1: EFTREFNUMBER=REF001, batch_id=2
├─ Product 2: EFTREFNUMBER=REF002, batch_id=2
├─ Product 3: EFTREFNUMBER=REF003, batch_id=2
└─ ... (100 products total)
   Total Amount: 500,000
   Total Rows: 100
```

---

## Automation Features

### ✅ Automatic Batch Creation
Every upload automatically creates a batch record with:
- Unique batch ID
- Batch name with timestamp
- Current user ID
- Upload timestamp
- Initial status (Pending)

### ✅ Automatic Product Linking
Every product in an upload automatically gets:
- batch_id reference to its batch
- Timestamp of creation
- Linked to user through batch

### ✅ Automatic Total Calculation
Totals are calculated and stored:
- **total_rows**: Count of successful products
- **total_amount**: Sum of CRAMOUNT field
- **status**: "Completed" or "Completed with Errors"

### ✅ Automatic Status Tracking
Status updates automatically:
- **Pending**: When batch is created
- **Completed**: When all products successfully added
- **Completed with Errors**: If some products fail

---

## Frontend Integration

### Upload History Page (upload_history.js)

```javascript
// Fetch batches from API
async function fetchBatchUploads() {
  const url = `http://127.0.0.1:8000/batch-uploads?user_id=${userId}`;
  const response = await fetch(url);
  uploadHistoryData = await response.json();
  renderUploadHistoryTable(uploadHistoryData);
}

// Display in table with:
// - Upload Date (from batch_upload.upload_date)
// - Batch Name (from batch_upload.batch_name)
// - Total Rows (from batch_upload.total_rows)
// - Total Amount (from batch_upload.total_amount)
// - Disbursed Amount (from batch_upload.disbursed_amount)
// - Status (from batch_upload.status)
```

---

## Example Workflow

### Scenario: User uploads 100 products

**Step 1:** User selects CSV file with 100 products
```
↓
POST /csv-upload with file
```

**Step 2:** Backend automatically:
```
Create BatchUpload:
  id = 2
  batch_name = "CSV_Upload_20260101_153500"
  upload_date = 2026-01-01 15:35:00
  status = "Pending"
  user_id = 1
```

**Step 3:** Insert each product
```
For 100 products:
  INSERT INTO product_1 VALUES (
    ...,
    batch_id = 2
  )
```

**Step 4:** Update batch with totals
```
UPDATE batch_upload SET
  total_rows = 100,
  total_amount = 500000,
  status = "Completed"
WHERE id = 2
```

**Step 5:** Return to frontend
```
{
  "batch_id": 2,
  "batch_name": "CSV_Upload_20260101_153500",
  "success_count": 100,
  "error_count": 0
}
```

**Step 6:** User sees in Upload History
```
Batch Name: CSV_Upload_20260101_153500
Upload Date: 01/01/2026 15:35:00
Total Rows: 100
Total Amount: ৳500,000.00
Status: Completed
```

---

## Summary

✅ **Fully Automated**
- No manual batch creation needed
- Each CSV upload automatically creates a batch
- All products automatically linked to their batch

✅ **Real-time Totals**
- Amounts calculated during upload
- Row counts tracked automatically
- Status updated as upload completes

✅ **Full Audit Trail**
- Every batch has timestamp
- User ID recorded
- All data preserved for reporting

✅ **Ready for Upload History**
- Batches available immediately via API
- Frontend displays all batch details
- Users can track all uploads with complete metrics
