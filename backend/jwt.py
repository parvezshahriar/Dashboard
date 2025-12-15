from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import TYPE_CHECKING
if TYPE_CHECKING:
   from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
import csv 
import os
import sys
from datetime import datetime, timedelta
import pytz
sys.path.insert(0, os.path.dirname(__file__))
from dbmodel import Product, User
from database import Session, engine, Base, AsyncSessionLocal, async_engine
from model import ProductSchema, UserCreat, Userlogin, ImageResponseModel, Country
from passlib.context import CryptContext
import hashlib
from PIL import Image
import io
import uuid
from typing import List, Any
from sqlalchemy import select
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

app = FastAPI()
# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
pwd_context = CryptContext(schemes=["argon2", "bcrypt_sha256", "bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Hash a password. If a backend raises the 72-byte ValueError (bcrypt),
    fall back to SHA-256 pre-hash and hash that instead.
    """
    try:
        return pwd_context.hash(plain_password)
    except ValueError as exc:
        msg = str(exc)
        if "72" in msg or "longer than 72" in msg:
            pre = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
            return pwd_context.hash(pre)
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password. If verification raises the 72-byte ValueError,
    pre-hash the plain password with SHA-256 and try again.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError as exc:
        msg = str(exc)
        if "72" in msg or "longer than 72" in msg:
            pre = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
            return pwd_context.verify(pre, hashed_password)
        raise

##registration endpoint
@app.post('/registration')
async def register_user(user: UserCreat):
    db = Session()
    try:
        existing_user = db.query(User).filter(User.username == user.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")

        # Save password in plain text format
        db_user = User(
            username=user.username,
            password=user.password  # Plain text password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"message": "User registered successfully", "username": user.username}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

##login endpoint
@app.post('/login')
async def login_user(user: Userlogin):
    db = Session()
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        
        print(f"[DEBUG] Login attempt - username: {user.username}")
        print(f"[DEBUG] User found: {db_user is not None}")
        if db_user:
            print(f"[DEBUG] Stored password: {db_user.password}")
            print(f"[DEBUG] Provided password: {user.password}")
            print(f"[DEBUG] Passwords match: {db_user.password == user.password}")

        # Compare plain text passwords directly
        if not db_user or db_user.password != user.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {
            "message": "Login successful", 
            "username": user.username,
            "id": db_user.id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

##Get all users (for debugging)
@app.get('/users')
def get_all_users():
    db = Session()
    try:
        users = db.query(User).all()
        return [{"id": u.id, "username": u.username, "password": u.password} for u in users]
    finally:
        db.close()

# Diagnostic endpoint - raw database check
@app.get('/diagnostic/products')
def diagnostic_products():
    db = Session()
    try:
        products = db.query(Product).all()
        diagnostic_list = []
        for product in products:
            diagnostic_list.append({
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "created_at_raw": str(product.created_at),
                "created_at_type": str(type(product.created_at)),
                "created_at_is_none": product.created_at is None
            })
        return {
            "total_products": len(diagnostic_list),
            "products": diagnostic_list
        }
    finally:
        db.close()

# Get all products
@app.get('/product')
def get_products():
    db = Session()
    try:
        products = db.query(Product).order_by(Product.id.asc()).all()
        product_list = []
        for product in products:
            # Debug logging
            print(f"[DEBUG] Product {product.id}: created_at type={type(product.created_at)}, value={product.created_at}")
            
            # Ensure created_at has a value
            created_at_str = "N/A"
            if product.created_at:
                try:
                    # Convert UTC to Bangladeshi time (UTC+6) by adding 6 hours
                    bd_time = product.created_at + timedelta(hours=6)
                    created_at_str = bd_time.strftime("%d/%m/%Y %H:%M:%S")
                    print(f"[DEBUG] Converted to BD time: {created_at_str}")
                except Exception as e:
                    print(f"[ERROR] Failed to format created_at for product {product.id}: {e}")
                    created_at_str = "Invalid Date"
            
            product_data = {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "created_at": created_at_str
            }
            product_list.append(product_data)
        return product_list
    finally:
        db.close()

# Update product
@app.put('/product/{product_id}')
def update_product(product_id: int, product: ProductSchema):
    db = Session()
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        db_product.name = product.name
        db_product.description = product.description
        db_product.price = product.price
        
        db.commit()
        db.refresh(db_product)
        
        # Convert UTC to Bangladeshi time (UTC+6) by adding 6 hours
        created_at_str = "N/A"
        if db_product.created_at:
            try:
                bd_time = db_product.created_at + timedelta(hours=6)
                created_at_str = bd_time.strftime("%d/%m/%Y %H:%M:%S")
            except Exception as e:
                print(f"[ERROR] Failed to format created_at for product {product_id}: {e}")
                created_at_str = "Invalid Date"
        
        return {
            "id": db_product.id,
            "name": db_product.name,
            "description": db_product.description,
            "price": db_product.price,
            "created_at": created_at_str
        }
    finally:
        db.close()

# Delete product
@app.delete('/product/{product_id}')
def delete_product(product_id: int):
    db = Session()
    try:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        db.delete(db_product)
        db.commit()
        
        return {"message": "Product deleted successfully"}
    finally:
        db.close()

# CSV Upload endpoint
@app.post('/csv-upload')
async def upload_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        
        reader = csv.DictReader(csv_text.strip().split('\n'))
        db = Session()
        success_count = 0
        error_count = 0
        
        try:
            for row in reader:
                try:
                    product = Product(
                        name=row.get('name') or row.get('Name'),
                        description=row.get('description') or row.get('Description'),
                        price=float(row.get('price') or row.get('Price')),
                        created_at=datetime.utcnow()  # Explicitly set upload timestamp
                    )
                    db.add(product)
                    db.commit()
                    success_count += 1
                except Exception as e:
                    db.rollback()
                    error_count += 1
                    print(f"Error importing row: {e}")
        finally:
            db.close()
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "message": f"Processed {success_count} products successfully, {error_count} errors"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Batch upload endpoint (JSON from frontend)
@app.post('/upload-batch')
async def upload_batch(data: dict):
    try:
        rows = data.get('rows', [])
        db = Session()
        success_count = 0
        error_count = 0
        
        try:
            for row in rows:
                try:
                    product = Product(
                        name=row.get('Name'),
                        description=row.get('Description'),
                        price=float(row.get('Price')),
                        created_at=datetime.utcnow()  # Explicitly set upload timestamp
                    )
                    db.add(product)
                    db.commit()
                    success_count += 1
                except Exception as e:
                    db.rollback()
                    error_count += 1
                    print(f"Error importing row: {e}")
        finally:
            db.close()
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "message": f"Processed {success_count} products successfully, {error_count} errors"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
