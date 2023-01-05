# Link shortener - flask

Demo Flask app to shorten URLs. 

Stores urls in a SQLite database.

## Getting Started

Requires recent Python (developed with 3.10.9)

1. Install flask

```sh
pip3 install flask
```

(or similar install command)

2. If the database does not exist, initialize it:

```sh
python initdb.py
```

3. Run the development server

```sh
flask run
```

Starts the app on localhost:5000

## Files

* `app.py`: Application logic
* `database.db`: The sqlite database
* `initdb.py`: initializes the database
* `schema.sql`: the SQL query to initialize the database
* `templates/`
  * `all.html`: page to list all the urls
  * `new.html`: form to create a new url
  * `created.html`: success page after creating a url
  * `edit.html`: form to edit a url
* `static/`
  * `favicon.png`: image for the tab bar
  * `style.css`: styles for the site

Other files:
* `.gitignore`: prevents some files from being tracked by Git
* `Procfile`: configuration for deployment
* `requirements.txt`: dependency versions, mostly for deployment
