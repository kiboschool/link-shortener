from fastapi import FastAPI, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from urllib.parse import urlparse

from database import Base, engine, SessionLocal, UrlCreate, get_url, get_urls, create_url, delete_url, update_url

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
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse("https://" + url)
    url = parsed.geturl()
    db_url = create_url(db=db, url=UrlCreate(original=url))
    return templates.TemplateResponse("created.html", {
        "request": request,
        "original": db_url.original,
        "shortened_url": "http://" + request.url.netloc + "/" + db_url.shortened
    })

@app.get('/urls', response_class=HTMLResponse)
def all_urls(request: Request, page: int | None = 1, db: Session = Depends(get_db)):
    urls = get_urls(db, page)
    urls = [{
        "shortened_url": "http://" + request.url.netloc + "/" + url.shortened,
        "original": url.original,
        "shortened": url.shortened,
        } for url in urls]
    next_page = None
    if len(urls) == 50:
        next_page = page + 1
    return templates.TemplateResponse("all.html", {
        "request": request,
        "urls": urls,
        "next_page": next_page
        })

@app.get('/{shortened}')
def shortname(shortened: str, db: Session = Depends(get_db)):
    url = get_url(db, shortened)
    if url and url.original:
        return RedirectResponse(url.original, status_code=302)
    else:
        return JSONResponse(status_code=404, content={"message": "Url not found"})

@app.post('/urls/delete/{shortened}')
def delete_shortname(shortened, db: Session = Depends(get_db)):
    try:
        delete_url(db, shortened)
        return RedirectResponse("/urls", status_code=302)
    except:
        return JSONResponse(status_code=404, content={"message": "Item not found"})


@app.get('/urls/edit/{shortened}')
def edit(shortened: str, request: Request, db: Session = Depends(get_db)):
    url = get_url(db, shortened)
    if url and url.original:
        return templates.TemplateResponse('edit.html', {
            "request": request,
            "url": url,
            "hostname": request.url.netloc
            })
    else:
        return JSONResponse(status_code=404, content={"message": "Item not found"})

@app.post('/urls/edit/{short}')
def update(short: str, request: Request, shortened: str = Form(),  db: Session = Depends(get_db)):
    url = get_url(db, short)
    if url and url.original:
        try:
            update_url(db, url, shortened)
            return RedirectResponse("/urls/edit/" + shortened, status_code=302)
        except:
            return templates.TemplateResponse("edit.html", {
                "hostname": request.url.hostname,
                "url": url,
                "error": "Update failed",
                "request": request,
            })
    else:
        return JSONResponse(status_code=404, content={"message": "Item not found"})
