from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductSchema(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str
    password: str
    role: Optional[str] = 'user'

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

    class Config:
        from_attributes = True
