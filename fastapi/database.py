from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import string
import random

from pydantic import BaseModel

SQLALCHEMY_DATABASE_URL = "sqlite:///./database.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# sqlalchemy model for a url
class UrlModel(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    original = Column(String, index=True)
    shortened = Column(String, index=True, unique=True)

# base pydantic model for a url
class UrlBase(BaseModel):
    original: str

class Url(UrlBase):
    id: int
    shortened: str
    class Config:
        orm_mode = True

class UrlCreate(UrlBase):
    pass

CHARS = string.ascii_letters + string.digits
def random_short_name():
    return "".join(random.choices(CHARS, k=6))

def create_url(db: Session, url: UrlCreate):
    db_url = UrlModel(original=url.original, shortened=random_short_name())
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url

def get_url(db: Session, shortened: str):
    return db.query(UrlModel).filter(UrlModel.shortened == shortened).first()

def get_urls(db: Session, page: int = 1, limit: int = 100):
    offset = (page - 1) * limit
    return db.query(UrlModel).offset(offset).limit(limit).all()
