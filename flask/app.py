import sqlite3
from urllib.parse import urlparse
from flask import Flask, render_template, request, g, redirect, abort
import string
import random

app = Flask(__name__)

DATABASE = 'database.db'
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def db_fetch(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def db_execute(query, args=()):
    conn = get_db()
    conn.execute(query, args)
    conn.commit()
    conn.close()

def add_to_db(shortened, original):
    db_execute("INSERT INTO urls (original, shortened) VALUES (:original, :shortened)", {
        "original": original,
        "shortened": shortened,
    })

def get_from_db(shortened):
    return db_fetch("SELECT * FROM urls WHERE urls.shortened = :shortened", {
        "shortened": shortened,
    }, one=True)

def update_in_db(url, shortened):
    db_execute("UPDATE urls SET shortened = :shortened WHERE urls.id = :id", {
        "shortened": shortened,
        "id": url['id'],
    })

PAGE_SIZE = 50
def get_all_from_db(page):
    return db_fetch("SELECT * FROM urls LIMIT :limit OFFSET :offset", {
        "limit": PAGE_SIZE,
        "offset": PAGE_SIZE * (page - 1),
    })

def delete_from_db(shortened):
    db_execute("DELETE FROM urls WHERE urls.shortened = :shortened", {
        "shortened": shortened,
    })

CHARS = string.ascii_letters + string.digits
def random_short_name():
    return "".join(random.choices(CHARS, k=6))

def short_to_url(shortname):
    url = app.url_for(endpoint='shortname', short=shortname, _external=True)
    return url

@app.route('/', methods=["GET"])
def new():
    return render_template('new.html')

@app.route('/', methods=["POST"])
def create():
    url = request.form.get('url')
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse("https://" + url)
    url = parsed.geturl()
    shortened = random_short_name()
    add_to_db(shortened, url)
    shortened_url = short_to_url(shortened)
    return render_template("created.html", shortened_url=shortened_url, original=url)

@app.route('/urls', methods=["GET"])
def all_urls():
    page = request.args.get('page') or "1"
    page = int(page)
    urls = get_all_from_db(page)
    urls = [{"shortened_url": short_to_url(url['shortened']), **url} for url in urls]
    next_page = None
    if len(urls) == PAGE_SIZE:
        next_page = (page or 1) + 1
    return render_template("all.html", urls=urls, next_page=next_page)

@app.route('/<short>', methods=["GET"])
def shortname(short):
    url = get_from_db(short)
    if url and url['original']:
        return redirect(url['original'], 302)
    else:
        return  abort(404, "No such shortcode")

@app.route('/urls/delete/<short>', methods=["POST"])
def delete_shortname(short):
    try:
        delete_from_db(short)
        return redirect("/urls", 302)
    except:
        return abort(404, "No such shortcode")

@app.route('/urls/edit/<short>', methods=["GET"])
def edit(short):
    url = get_from_db(short)
    if short and url and url['original']:
        return render_template('edit.html', url=url, hostname=request.host)
    else:
      return abort(404, "No such shortcode")

@app.route('/urls/edit/<short>', methods=["POST"])
def update(short):
    url = get_from_db(short)
    if url and url['original']:
        shortened = request.form.get('shortened')
        try:
            update_in_db(url, shortened)
            return redirect(app.url_for("edit", short=shortened), 302)
        except:
            return render_template("edit.html", hostname=request.host, url=url, error="Update failed")
    else:
        return abort(404, "No such shortcode")

