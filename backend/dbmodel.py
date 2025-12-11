from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class Product(Base):
    __tablename__ = 'product_1'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)

class ImageResponseModel(Base):
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    filepath = Column(String, unique=True)


# Backwards-compatible alias used by the app
class ImageModel(ImageResponseModel):
    pass

class Country(Base):
    __tablename__ = 'country'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True)
