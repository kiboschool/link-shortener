const http = require('node:http');
const urllib = require('url');
const querystring = require('querystring');
const ejs = require('ejs')
const statik = require('node-static')
require('dotenv/config');
const { drizzle } = require('drizzle-orm/libsql');
const { eq } = require('drizzle-orm');
const schema = require("./schema.ts")
const urls = schema.urls

const db = drizzle(process.env.DB_FILE_NAME, { logger: true, schema });

const port = 3000

const fileserver = new statik.Server('.');

const render = (res, body, status=200) => {
  res.writeHead(status, {'Content-Type': 'text/html'});
  res.write(body);
  res.end();
}

const renderTemplate = (res, template, data) => {
  ejs.renderFile(template, data, {}, function (err, str) {
    if (err) { console.error(err); return }
    render(res, str);
  });
}

const redirect = (res, url) => {
  res.writeHead(302, {
    Location: url,
  })
  res.end()
}

/* Database */
const addToDB = async (shortened, original) => {
  const insert = db.insert(urls)
  const q = insert.values({shortened, original});
  return await q
}

const getFromDB = async (shortened) => {
  return await db.query.urls.findFirst({
    where: eq(urls.shortened, shortened)
  });
}

const updateInDB = async (url, shortened) => {
  return await db.update(urls).set({ shortened }).where(eq(urls.id, url.id))
}

const deleteFromDB = async (shortened) => {
  return await db.delete(urls).where(eq(urls.shortened, shortened))
}

const pageSize = 50;
const getAllFromDB = async (page) => {
  return await db.select().from(urls).limit(pageSize).offset(pageSize * (page - 1));
}


/* Helpers */
// 6-character random short name
// 36 ** 6 == 2_176_782_336
// should be ~1e5 before a collision, which is good enough for this toy example
const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
function randomShortName() {
  let short = ""
  for (let i = 0; i < 6; i++) {
    let ind = Math.floor(Math.random() * chars.length)
    short += chars[ind]
  }
  return short
}

const toUrl = (req, path) => `${req.headers.host}/${path}`

const readBody = (req, callback) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    body = querystring.parse(body);
    callback(body)
  })
}

const handleCreateUrl = async (req, res) => {
  return readBody(req, async (body) => {
    let original = urllib.parse(body.url)
    if (!original.protocol) {
      original = urllib.parse("https://" + body.url)
    }
    original = new URL(original.href).href
    let shortened = randomShortName();
    await addToDB(shortened, original)
    let shortenedUrl = toUrl(req, shortened)
    return renderTemplate(res, "templates/created.ejs", {shortenedUrl, original})
  });
}

const handleGetAllUrls = async (req, res) => {

  let parsed = urllib.parse(req.url)
  let page = req.url.split('page=')[1]
  let urls = await getAllFromDB(page);
  urls.forEach(url => {
    url.shortenedUrl = toUrl(req, url.shortened)
  })
  return renderTemplate(res, "templates/all.ejs", { urls, nextPage: "2"})
}

const handleRequest = async (req, res) => {
  if (req.url.startsWith('/public')) {
    console.log('static fileserver')
    return fileserver.serve(req, res);
  } else if (req.url == "/" && req.method == "GET") {
    return renderTemplate(res, "templates/new.ejs")
  } else if (req.url == "/" && req.method == "POST") {
    return handleCreateUrl(req, res);
  } else if (req.url.startsWith("/urls/delete/") && req.method == "POST") {
    let shortened = req.url.split('/')[3]
    await deleteFromDB(shortened)
    return redirect(res, "/urls")
  } else if (req.url.startsWith("/urls/edit/") && req.method == "GET") {
    let shortened = req.url.split('/')[3]
    let url = await getFromDB(shortened)
    if (url) {
      return renderTemplate(res, "templates/edit.ejs", { hostname: req.headers.host, url, error: null })
    } else {
      return render(res, '<h1>404: Page not found</h1>', 404)
    }
  } else if (req.url.startsWith("/urls/edit/") && req.method == "POST") {
    let shortened = req.url.split('/')[3]
    let url = await getFromDB(shortened)
    if (url) {
      return readBody(req, async (body) => {
        let updated = body.shortened
        await updateInDB(url, updated)
        return redirect(res, "/urls")
      })
    } else {
      return render(res, '<h1>404: Page not found</h1>', 404)
    }
  } else if (req.url.startsWith("/urls") && req.method == "GET") {
    return handleGetAllUrls(req, res);
  } else {
    let shortened = req.url.slice(1);
    let url = await getFromDB(shortened)
    if (url) {
      return redirect(res, url.original)
    } else {
      return render(res, '<h1>404: Page not found</h1>', 404)
    }
  }
}

let server = http.createServer((req, res) => {
  console.log(req.method, req.url)
  try {
    return handleRequest(req, res);
  } catch (e) {
    console.error(e)
    return render(res, '<h1>500: An error has occurred</h1>', 500)
  }
})
server.listen(port);
console.log("listening on http://localhost:" + port)
