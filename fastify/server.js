import Fastify from 'fastify'
import ejs from 'ejs'
import view from "@fastify/view"
import formbody from '@fastify/formbody'
import url from 'node:url'

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

// in memory "database"
// TODO: actual database
const db = {}
const addToDB = (shortname, url) => {
  db[shortname] = url 
}
const getFromDB = (shortname) => {
  return db[shortname]
}

const fastify = Fastify({
  logger: true
})

fastify.register(view, { engine: { ejs } });
fastify.register(formbody)

async function routes (fastify, options) {
  fastify.get("/", (req, reply) => {
    reply.view("/templates/new.ejs", { text: "" });
  });

  fastify.post("/", (req, reply) => {
    // if url is valid but missing protocol, add it
    let parsed = url.parse(req.body.url)
    if (!parsed.protocol) {
      parsed = url.parse("https://" + req.body.url)
    }
    let mapped_url = new URL(parsed.href).href
    let name = randomShortName();
    addToDB(name, mapped_url)
    let new_url =  req.hostname + '/' + name
    reply.view("/templates/created.ejs", { new_url, mapped_url });
  });

  fastify.get("/:short", (req, reply) => {
    let {short} = req.params
    let url = getFromDB(short)
    if (url) {
      reply.redirect(302, url);
    } else {
      reply.code(404).send({message: "No such shortcode"})
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
