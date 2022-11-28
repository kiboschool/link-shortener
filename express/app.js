var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var url = require('url');
var PrismaClient = require('@prisma/client').PrismaClient;

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

const getHostname = (req) => `${req.hostname}:${req.app.get('port')}`
const shortToUrl = (shortname, req) => `${getHostname(req)}/${shortname}`

/* DB */
const prisma = new PrismaClient()
/* DB helpers */
const addToDB = async (shortened, original) => {
  return await prisma.url.create({
    data: {
      original,
      shortened,
    },
  })
}

const getFromDB = async (shortened) => {
  return await prisma.url.findUnique({
    where: { shortened }
  })
}

const updateInDB = async (url, shortened) => {
  return await prisma.url.update({
    where: { id: url.id },
    data: { shortened }
  })
}

const pageSize = 50;
const getAllFromDB = async ({page}) => {
  page = page - 1;
  return await prisma.url.findMany({skip: page * pageSize, take: pageSize})
}

const deleteFromDB = async (shortened) => {
  return await prisma.url.delete({where: {shortened}})
}


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// various middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/', function(req, res) {
  res.render('new');
});

app.post("/", async (req, res) => {
  // if url is valid but missing protocol, add it
  let parsed = url.parse(req.body.url)
  if (!parsed.protocol) {
    parsed = url.parse("https://" + req.body.url)
  }
  let original = new URL(parsed.href).href
  let shortened = randomShortName();
  await addToDB(shortened, original)
  let shortenedUrl = shortToUrl(shortened, req)
  return res.render("created", { shortenedUrl, original });
});

app.get('/urls', async (req, res) => {
  let page = req.query.page || "1";
  page = parseInt(page)
  let urls = await getAllFromDB({ page });
  urls = urls.map(url => ({ shortenedUrl: shortToUrl(url.shortened, req), ...url}))
  let more = urls.length == pageSize;
  let nextPage = null;
  if (more) {
    nextPage = (page || 1) + 1;
  }
  return res.render("all", { urls, nextPage });
})

app.post('/urls/delete/:short', async (req, res) => {
  let {short} = req.params

  try {
    await deleteFromDB(short)
    return res.redirect(302, "/urls")
  } catch (e) {
    return res.status(404).json({message: "No such shortcode"})
  }
})

app.get('/urls/edit/:short', async (req, res) => {
    let hostname = getHostname(req)
    let {short} = req.params
    let url = await getFromDB(short)
    if (url && url.original) {
      return res.render("edit", {hostname, url, error: null});
    } else {
      return res.status(404).json({message: "No such shortcode"})
    }
  })

app.post('/urls/edit/:short', async (req, res) => {
  let hostname = getHostname(req)
  let {short} = req.params
  let url = await getFromDB(short)
  if (url && url.original) {
    let shortened = req.body.shortened;
    try {
      url = await updateInDB(url, shortened);
      return res.redirect(302, "/urls/edit/" + url.shortened)
    } catch (error) {
      // unique constraint violated
      if (error.code == "P2002") {
        return res.render("edit", {hostname, url, error: `The short name '${shortened}' is already in use`});
      } else {
        // dunno what it was, rethrow
        throw error
      }
    }
  } else {
    return res.status(404).json({message: "No such shortcode"})
  }
});

app.get('/:short', async (req, res) => {
  let {short} = req.params
  let url = await getFromDB(short)
  if (url && url.original) {
    return res.redirect(302, url.original);
  } else {
    return res.status(404).json({message: "No such shortcode"})
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
