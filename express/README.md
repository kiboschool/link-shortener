# Url shortener - Express

https://expressjs.com/en/starter/generator.html

Get started:

- Install Dependencies: `npm install`
- Setup DB: install postgres, add a `DATABASE_URL` to `.env`, and `npx prisma migrate dev`
- Run the dev server: `npm run start`

## Routes

- "/" - form to create a short url
- "/:short" - fetch a given url and redirect
- "/urls" - show the list of all urls created
- "/urls/edit/:short" - page to view and edit a url
- "/urls/delete/:short" - handler to delete url
