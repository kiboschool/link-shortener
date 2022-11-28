var express = require('express');
var router = express.Router();
var url = require('url');
var PrismaClient = require('@prisma/client').PrismaClient;

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

/* GET page to create a new url */
router.get('/', function(req, res) {
  res.render('new');
});

const prisma = new PrismaClient()

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

router.post("/", async (req, res) => {
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

router.get('/urls', async (req, res) => {
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

router.post('/urls/delete/:short', async (req, res) => {
  let {short} = req.params

  try {
    await deleteFromDB(short)
    return res.redirect(302, "/urls")
  } catch (e) {
    return res.status(404).json({message: "No such shortcode"})
  }
})

router.get('/urls/edit/:short', async (req, res) => {
    let hostname = getHostname(req)
    let {short} = req.params
    let url = await getFromDB(short)
    if (url && url.original) {
      return res.render("edit", {hostname, url, error: null});
    } else {
      return res.status(404).json({message: "No such shortcode"})
    }
  })

router.post('/urls/edit/:short', async (req, res) => {
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

router.get('/:short', async (req, res) => {
  let {short} = req.params
  let url = await getFromDB(short)
  if (url && url.original) {
    return res.redirect(302, url.original);
  } else {
    return res.status(404).json({message: "No such shortcode"})
  }
});


module.exports = router;
