# Link Shortener - Node (http module, without express)

A version of the link shortener app using Node, without a framework.

Dependencies:
- ejs for rendering templates
- node-static for serving static files
- drizzle orm for database (libsql/client, dotenv, drizzle-orm)

## Get Started

Install dependencies

```sh
npm install
```

Migrate the db

```sh
npx drizzle-kit push
```

Start the dev server

```sh
node server.js
```
