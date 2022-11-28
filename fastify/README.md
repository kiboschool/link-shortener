# url shortener - fastify

Get started:

- Install Dependencies: `npm install`
- Setup DB: install postgres, add a `DATABASE_URL` to `.env`, and `npx prisma migrate dev`
- Run the dev server: `node server.js`

## Routes

- "/" - form to create a short url
- "/:short" - fetch a given url and redirect
- "/urls" - show the list of all urls created
- "/urls/edit/:short" - page to view and edit a url
- "/urls/delete/:short" - handler to delete url

## Advanced features, which aren't present

- random cookie-based user session
- users / sign in
- stats for urls
