from typing import Union

from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal, Url, UrlCreate, get_url, get_urls, create_url

app = FastAPI()

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def new(request: Request):
    return templates.TemplateResponse("new.html", {"request": request})

@app.post("/", response_class=HTMLResponse)
def create(request: Request, url: str = Form(), db: Session = Depends(get_db)):
    db_url = create_url(db=db, url=UrlCreate(original=url))
    return templates.TemplateResponse("created.html", {
        "request": request,
        "original": db_url.original,
        "shortened_url": db_url.shortened
    })