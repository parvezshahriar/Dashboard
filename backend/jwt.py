from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from dbmodel import Product, User
from database import Session
from model import ProductSchema, UserCreate, UserLogin
from rbac import Permission, has_permission, Role

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper function to check user permissions
def check_permission(user_id: int, permission: Permission) -> User:
    """Check if user has the required permission"""
    db = Session()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_role = Role(user.role)
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. You need '{permission.value}' access"
            )
        
        return user
    finally:
        db.close()


# Registration endpoint
@app.post('/registration')
async def register_user(user: UserCreate):
    db = Session()
    try:
        existing_user = db.query(User).filter(User.username == user.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")

        db_user = User(
            username=user.username,
            password=user.password,
            role=user.role or 'user',
            is_active=1
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "message": "User registered successfully",
            "username": user.username,
            "role": db_user.role
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


# Login endpoint
@app.post('/login')
async def login_user(user: UserLogin):
    db = Session()
    try:
        db_user = db.query(User).filter(User.username == user.username).first()

        if not db_user or db_user.password != user.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        return {
            "message": "Login successful",
            "id": db_user.id,
            "username": db_user.username,
            "role": db_user.role
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


# Get all products
@app.get('/product')
def get_products(user_id: int = None):
    """Get all products - VIEW_PRODUCTS permission required"""
    db = Session()
    try:
        # Check permission if user_id provided
        if user_id:
            check_permission(user_id, Permission.VIEW_PRODUCTS)
        
        products = db.query(Product).order_by(Product.id.asc()).all()
        product_list = []
        
        for product in products:
            created_at_str = "N/A"
            if product.created_at:
                try:
                    # Convert UTC to Bangladeshi time (UTC+6)
                    bd_time = product.created_at + timedelta(hours=6)
                    created_at_str = bd_time.strftime("%d/%m/%Y %H:%M:%S")
                except Exception as e:
                    print(f"[ERROR] Date formatting failed for product {product.id}: {e}")
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
def update_product(product_id: int, product: ProductSchema, user_id: int = None):
    """Update product - EDIT_PRODUCT permission required"""
    # Check permission if user_id provided
    if user_id:
        check_permission(user_id, Permission.EDIT_PRODUCT)
    
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

        # Convert UTC to Bangladeshi time (UTC+6)
        created_at_str = "N/A"
        if db_product.created_at:
            try:
                bd_time = db_product.created_at + timedelta(hours=6)
                created_at_str = bd_time.strftime("%d/%m/%Y %H:%M:%S")
            except Exception as e:
                print(f"[ERROR] Date formatting failed for product {product_id}: {e}")
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
def delete_product(product_id: int, user_id: int = None):
    """Delete product - DELETE_PRODUCT permission required (Admin only)"""
    # Check permission if user_id provided
    if user_id:
        check_permission(user_id, Permission.DELETE_PRODUCT)
    
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
async def upload_csv(file: UploadFile = File(...), user_id: int = None):
    """Upload CSV file - UPLOAD_CSV permission required"""
    # Check permission if user_id provided
    if user_id:
        check_permission(user_id, Permission.UPLOAD_CSV)
    
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
                        created_at=datetime.utcnow()
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
async def upload_batch(data: dict, user_id: int = None):
    """Batch upload products - PROCESS_VALID_ROWS permission required"""
    # Check permission if user_id provided
    if user_id:
        check_permission(user_id, Permission.PROCESS_VALID_ROWS)
    
    try:
        rows = data.get('rows', [])
        db = Session()
        success_count = 0
        error_count = 0

        try:
            for row in rows:
                try:
                    product = Product(
                        name=row.get('name'),
                        description=row.get('description'),
                        price=float(row.get('price')),
                        created_at=datetime.utcnow()
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
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

