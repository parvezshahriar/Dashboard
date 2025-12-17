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
    role = Column(String, default='user')
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

