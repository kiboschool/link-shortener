# Link shortener

Live Demo: https://ls.up.railway.app/urls

This app is a link shortener like [bitly](https://bitly.com/), [tinyurl](https://tinyurl.com/), or [short.io](https://short.io/).

This repo has several implementations of the same application, using different 
languages and web frameworks.

Different versions use the same html, css, and logic every time, so all versions 
should be the same.


## Testing

Test all the versions with

```
pytest
```

or an individual version with

```
pytest --app=flask
```

for some app name (the name of the directory where the app lives).

Note: running all the tests is a bit slow since it spins up each app, and does it all serially. Since apps sometimes collide on the same port, hard to parallelize. If we let the port be configured, that'd make parallel testing easier.

## Features

* Create a new short url from a given link
* When navigating to the short url, the app will redirect to the original link
* View all the short urls that have been created
* Edit or delete a short url

Features the app does not have:
* users or logins
* click tracking
* custom domains

## Languages and frameworks

- [Bun](/bun)
- [Django](/django)
- [Express](/express)
- [FastAPI](/fastapi)
- [Fastify](/fastify)
- [Flask](/flask)
- [Go](/go)
- [Node](/node)
- [Sinatra](/sinatra)
- [Spring Boot](/spring)
