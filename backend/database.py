from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
import os

db_url = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:110032@localhost:5432/postgres",
)

engine = create_engine(db_url)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
