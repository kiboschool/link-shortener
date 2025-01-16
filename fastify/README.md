# url shortener - fastify

Get started:

- Install Dependencies: `npm install`
- Setup DB: 
  - install postgres
  - create the db (`createdb link-shortener-fastify`)
  - add a `DATABASE_URL` to `.env` (`DATABASE_URL="postgresql://rob@localhost/link-shortener-fastify"`
  - and `npx prisma migrate dev`
- Run the dev server: `node server.js`

## Routes

- "/" - form to create a short url
- "/:short" - fetch a given url and redirect
- "/urls" - show the list of all urls created
- "/urls/edit/:short" - page to view and edit a url
- "/urls/delete/:short" - handler to delete url
