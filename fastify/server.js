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

const fastify = Fastify({
  logger: true
})

fastify.register(view, { engine: { ejs } });
fastify.register(formbody)
fastify.register(fstatic, { prefix: '/public/', root: path.join(url.fileURLToPath(new URL('.', import.meta.url)), 'public') })

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
    let mapped_url = new URL(parsed.href).href
    let name = randomShortName();
    await addToDB(name, mapped_url)
    let new_url =  req.hostname + '/' + name
    return reply.view("/templates/created.ejs", { new_url, mapped_url });
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
}

fastify.register(routes)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
