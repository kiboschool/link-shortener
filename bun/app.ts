import { match } from 'path-to-regexp'
import { Database } from "bun:sqlite"
import ejs from 'ejs'
import { parse } from 'url'
import querystring from 'querystring'

/* generic bun Router */
type Handler = ((req: Request) => Response) | ((req: Request) => Promise<Response>);
interface Route { route: string, handler: Handler }
interface Handlers { get: Route[], post: Route[] }
const Router = () => {
  // there are only two kinds of http requests
  const handlers: Handlers = { get: [], post: []}
  return {
    get: (route: string, handler: Handler): void => { handlers.get.push({route, handler}) },
    post: (route: string, handler: Handler): void => { handlers.post.push({route, handler}) },
    _handle: (req: Request): Response => {
      let method = req.method.toLowerCase();
      // the URL() constructor sanitizes urls, which prevents path traversal
      let path = new URL(req.url).pathname;
      for (let handler of handlers[method]) {
        let hit = match(handler.route)(path)
        if (hit) {
          req.params = hit.params
          return handler.handler(req)
        }
      }

      return new Response("No matching route", { status: 404, statusText: "Not Found." });
    }
  }
}

/* templates */
const templates = {
  new: ejs.compile(await Bun.file("templates/new.ejs").text()),
  created: ejs.compile(await Bun.file("templates/created.ejs").text()),
  edit: ejs.compile(await Bun.file("templates/edit.ejs").text()),
  all: ejs.compile(await Bun.file("templates/all.ejs").text()),
}

const render = (template, data) => {
  let html = template(data)
  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "text/html; charset=utf-8", },
  })
}

/* DB helpers */
const db = new Database("bun-urls.sqlite");
db.run("CREATE TABLE IF NOT EXISTS urls (id INTEGER PRIMARY KEY AUTOINCREMENT, original TEXT NOT NULL, shortened TEXT NOT NULL UNIQUE)");

const addStmt = db.query("INSERT INTO urls (original, shortened) VALUES ($original, $shortened)")
const addToDB = ($shortened, $original) => addStmt.run({ $original, $shortened});

const getStmt = db.query("SELECT * FROM urls WHERE urls.shortened = $shortened")
const getFromDB = ($shortened) => getStmt.get({ $shortened })

const updateStmt = db.query("UPDATE urls SET shortened = $shortened WHERE urls.id = $id")
const updateInDB = (url, $shortened) => updateStmt.run({$shortened, $id: url.id})

const pageSize = 50;
const getAllStmt = db.query("SELECT * FROM urls LIMIT $limit OFFSET $offset")
const getAllFromDB = ({page}) => {
  return getAllStmt.all({$limit: pageSize, $offset: pageSize * (page - 1)})
}

const deleteStmt = db.query("DELETE FROM urls WHERE urls.shortened = $shortened")
const deleteFromDB = ($shortened) => deleteStmt.run({$shortened})

/* assorted other helpers */
const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
const randomShortName = () => {
  let short = ""
  for (let i = 0; i < 6; i++) {
    let ind = Math.floor(Math.random() * chars.length)
    short += chars[ind]
  }
  return short
}

// Ladies and Gentlemen, the ReadableStream
async function streamToString(stream: ReadableStream): Promise<string> {
  const chunks: Array<any> = [];
  for await (let chunk of stream) {
      chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks);
  return buffer.toString("utf-8")
}
function params(req: Request) {
  return {...(new URL(req.url).searchParams.entries()) }
}

const host = (req) => req.headers.get('host')
const shortToUrl = (shortname, req) => `${req.protocol || 'http'}://${req.headers.get('host')}/${shortname}`
const err = () => new Response("something went wrong", { status: 500 })

/* Application logic */
const app = Router()

// register static files under public
app.get('/public/:filename', (req) => {
  // if there's no path traversal vuln, it's because I'm lucky, not good
  return new Response(Bun.file(`public/${req.params.filename}`))
})

app.get("/", (_req) => {
  return render(templates["new"], {})
});

app.post("/", async (req) => {
  // guard
  if (!req.body) { return err() }
  const body = querystring.parse(await streamToString(req.body))
  if (!body.url) { return err() }
  let parsed = parse(body.url)
  if (!parsed.protocol) {
    parsed = parse("https://" + body.url)
  }
  let original = new URL(parsed.href).href
  let shortened = randomShortName();
  addToDB(shortened, original)
  let shortenedUrl = shortToUrl(shortened, req)
  return render(templates["created"], { shortenedUrl, original });
});

app.get('/urls', async (req) => {
  let page = parseInt(params(req)['page']) || 1
  let urls = await getAllFromDB({ page });
  urls = urls.map(url => ({ shortenedUrl: shortToUrl(url.shortened, req), ...url }))
  let more = urls.length == pageSize;
  let nextPage = null;
  if (more) {
    nextPage = (page || 1) + 1;
  }
  return render(templates["all"], { urls, nextPage });
})

app.get("/:short", async (req: Request) => {
  let short = req.params['short']
  let url = await getFromDB(short)
  if (url && url.original) {
    return new Response("", { status: 302, headers: { location: url.original } });
  } else {
    return new Response("No such shortcode: " + short, { status: 404 })
  }
})

app.post('/urls/delete/:short', async (req) => {
  let short = req.params['short']

  try {
    deleteFromDB(short)
    return new Response("", { status: 302, headers: { location: "/urls" } });
  } catch (e) {
    return new Response("No such shortcode: " + short, { status: 404 })
  }
})

app.get('/urls/edit/:short', async (req) => {
  let hostname = host(req)
  let short = req.params['short']
  let url = await getFromDB(short)
  if (url && url.original) {
    return render(templates["edit"], { hostname, url, error: null });
  } else {
    return new Response("No such shortcode: " + short, { status: 404 })
  }
})

app.post('/urls/edit/:short', async (req) => {
  if (!req.body) { return err() }
  let hostname = host(req)
  let short = req.params['short']
  let url = await getFromDB(short)
  const body = querystring.parse(await streamToString(req.body))
  let shortened = body.shortened;
  if (url && url.original && shortened) {
    try {
      updateInDB(url, shortened);
      return new Response("", { status: 302, headers: { location: "/urls/edit/" + shortened} });
    } catch (error) {
      // unique constraint violated
      if (error.code == "P2002") {
        return render(templates["edit"], { hostname, url, error: `The short name '${shortened}' is already in use` });
      } else {
        // dunno what it was, rethrow
        throw error
      }
    }
  } else {
    return new Response("No such shortcode: " + short, { status: 404, statusText: "Not Found." });
  }
});

export default {
  port: 3000,
  fetch(req: Request): Response {
    console.log(req.method, req.url)
    return app._handle(req)
  },
}
