import Fastify from 'fastify'
import ejs from 'ejs'
import view from '@fastify/view'
import formbody from '@fastify/formbody'
import fstatic from '@fastify/static'
import url from 'node:url'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

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

const fastify = Fastify({
  logger: true
})

fastify.register(view, { engine: { ejs } });
fastify.register(formbody)
fastify.register(fstatic, { prefix: '/public/', root: path.join(url.fileURLToPath(new URL('.', import.meta.url)), 'public') })

const shortToUrl = (shortname, req) => `${req.hostname}/${shortname}`

async function routes (fastify, options) {
  fastify.get("/", (req, reply) => {
    reply.view("/templates/new.ejs");
  });

  fastify.post("/", async (req, reply) => {
    // if url is valid but missing protocol, add it
    let parsed = url.parse(req.body.url)
    if (!parsed.protocol) {
      parsed = url.parse("https://" + req.body.url)
    }
    let original = new URL(parsed.href).href
    let shortened = randomShortName();
    await addToDB(shortened, original)
    let shortenedUrl = shortToUrl(shortened, req)
    return reply.view("/templates/created.ejs", { shortenedUrl, original });
  });

  fastify.get("/:short", async (req, reply) => {
    let {short} = req.params
    let url = await getFromDB(short)
    if (url && url.original) {
      return reply.redirect(302, url.original);
    } else {
      return reply.code(404).send({message: "No such shortcode"})
    }
  })

  fastify.get('/urls', async (req, reply) => {
    let page = req.query.page || "1";
    page = parseInt(page)
    let urls = await getAllFromDB({ page });
    urls = urls.map(url => ({ shortenedUrl: shortToUrl(url.shortened, req), ...url}))
    let more = urls.length == pageSize;
    let nextPage = null;
    if (more) {
      nextPage = (page || 1) + 1;
    }
    return reply.view("/templates/all.ejs", { urls, nextPage });
  })

  fastify.post('/urls/delete/:short', async (req, reply) => {
    let {short} = req.params

    try {
      await deleteFromDB(short)
      return reply.redirect(302, "/urls")
    } catch (e) {
      return reply.code(404).send({message: "No such shortcode"})
    }
  })

  fastify.get('/urls/edit/:short', async (req, reply) => {
    let hostname = req.hostname
    let {short} = req.params
    let url = await getFromDB(short)
    if (url && url.original) {
      return reply.view("/templates/edit.ejs", {hostname, url, error: null});
    } else {
      return reply.code(404).send({message: "No such shortcode"})
    }
  })

  fastify.post('/urls/edit/:short', async (req, reply) => {
    let hostname = req.hostname
    let {short} = req.params
    let url = await getFromDB(short)
    if (url && url.original) {
      let shortened = req.body.shortened;
      try {
        url = await updateInDB(url, shortened);
        return reply.redirect(302, "/urls/edit/" + url.shortened)
      } catch (error) {
        // unique constraint violated
        if (error.code == "P2002") {
          return reply.view("/templates/edit.ejs", {hostname, url, error: `The short name '${shortened}' is already in use`});
        } else {
          // dunno what it was, rethrow
          throw error
        }
      }
    } else {
      return reply.code(404).send({message: "No such shortcode"})
    }
  });
}

fastify.register(routes)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
