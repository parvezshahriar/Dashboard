# Government Disbursement Portal

A FastAPI-based web application for managing government disbursement file uploads with real-time product tracking and timestamps.

## Project Structure

```
Dashboard/
├── .venv/                    # Python virtual environment
├── backend/                  # Backend API files
│   ├── jwt.py               # FastAPI main application
│   ├── database.py          # Database configuration
│   ├── dbmodel.py           # SQLAlchemy database models
│   ├── model.py             # Pydantic API models/schemas
│   ├── reset_db.py          # Database reset utility
│   └── run_api.py           # API startup wrapper script
├── frontend/                 # Frontend files
│   ├── index.html           # Main HTML page
│   ├── index.css            # Styling
│   └── index.js             # JavaScript functionality
├── start.py                 # Complete startup script
└── README.md                # This file
```

## Prerequisites

- Python 3.13+
- PostgreSQL database
- Virtual environment with required packages installed

## Installation

1. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary asyncpg pillow passlib python-multipart
   ```

3. **Configure database:**
   - Update `DATABASE_URL` in `backend/database.py` with your PostgreSQL credentials
   - Default: `postgresql://postgres:110032@localhost:5432/postgres`

## Running the Application

### Option 1: Automated Startup (Recommended)
```bash
python start.py
```

### Option 2: Manual Startup

**Terminal 1 - Start Backend API:**
```bash
python backend/run_api.py
```
API will be available at: `http://127.0.0.1:8000`

**Terminal 2 - Start Frontend Server:**
```bash
cd frontend
python -m http.server 3000
```
Frontend will be available at: `http://localhost:3000`

## Features

- **CSV File Upload**: Import product data from CSV files
- **Real-time Timestamps**: Automatically logs when files are uploaded
- **Product Management**: View, edit, and delete products
- **Status Tracking**: Monitor approval status of uploads
- **Database Logging**: Complete audit trail with timestamps
- **Responsive UI**: Modern dashboard interface with Nagad branding

## API Endpoints

- `GET /product` - Get all products
- `GET /product/{id}` - Get product by ID
- `POST /csv-upload` - Upload CSV file with products
- `GET /docs` - API documentation (Swagger UI)

## Database Schema

### Products Table
- `id`: Integer (Primary Key)
- `name`: String
- `description`: String
- `price`: Float
- `created_at`: DateTime (Timestamp of upload)

## Environment Variables

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Troubleshooting

**API not loading?**
- Ensure the backend directory is correctly set
- Check PostgreSQL is running
- Verify DATABASE_URL is correct

**Frontend not connecting to API?**
- Ensure API is running on `http://127.0.0.1:8000`
- Check browser console for CORS errors
- Verify both services are on correct ports

**Database issues?**
- Run `python backend/reset_db.py` to reset tables
- Check PostgreSQL connection string
- Verify database user has proper permissions

## Notes

- The API uses `reload=True` by default for development
- Frontend is served via Python's built-in HTTP server
- All product uploads are automatically timestamped
- Status field is generated randomly (can be customized)
