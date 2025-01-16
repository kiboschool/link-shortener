# Link shortener - Express

Demo Express app to shorten URLs.

Kickstarted with the [Express Generator](https://expressjs.com/en/starter/generator.html)

## Getting started

- Install Dependencies: `npm install`
- Setup DB:
  - Install postgres (`brew install postgresql && brew services start postgresql`)
  - create and run a database (`createdb express-link-shortener`)
  - Add a `DATABASE_URL` to `.env` (`DATABASE_URL="postgresql://rob@localhost/express-link-shortener"`)
  - Run `npx prisma migrate dev`
- Run the dev server: `npm run start`

## Prisma

Prisma is used to manage the Postgres database. The docs are good:

- [Getting started](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-postgres)
- [CLI reference](https://www.prisma.io/docs/reference/api-reference/command-reference)

The workflow is (more or less):
- edit `schema.prisma`
- run `npx prisma generate`
- if needed, run `npx prisma migrate dev` to update the database

## Routes

- "/" - form to create a short url
- "/:short" - fetch a given url and redirect
- "/urls" - show the list of all urls created
- "/urls/edit/:short" - page to view and edit a url
- "/urls/delete/:short" - handler to delete url
