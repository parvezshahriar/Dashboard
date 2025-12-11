from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import TYPE_CHECKING
if TYPE_CHECKING:
   from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
import csv 
import os
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


