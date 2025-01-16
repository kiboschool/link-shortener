# fastapi

Link shortener with fastapi. Uses sqlalchemy for the database.


install packages
```sh
uv sync
```

setup database

```sh
python -c "import database; database.Base.metadata.create_all(database.engine)"
```

```sh
uv run fastapi dev
```

or (prod)

```sh
uv run fastapi run
```


## Routes

- "/" - form to create a short url
- "/:short" - fetch a given url and redirect
- "/urls" - show the list of all urls created
- "/urls/edit/:short" - page to view and edit a url
- "/urls/delete/:short" - handler to delete url
