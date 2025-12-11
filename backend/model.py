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

class UserCreat(BaseModel):
    username: str
    password: str

    class Config:
        from_attributes = True

class Userlogin(BaseModel):
    id: Optional[int] = None
    username: str
    password: str
        
    class Config:
        from_attributes = True

class ImageResponseModel(BaseModel):
    id: Optional[int] = None
    filename: str
    filepath: str
    url: Optional[str] = None

    class Config:
        from_attributes = True

class Country(BaseModel):
    id: Optional[int] = None
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True