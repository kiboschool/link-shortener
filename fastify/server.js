import Fastify from 'fastify'
import ejs from 'ejs'
import view from "@fastify/view"
import formbody from '@fastify/formbody'

function randomShortName() {
  let names = ['aaaaa', 'cute-name', 'pets', 'some-url', 'another']
  let i = Math.floor(Math.random() * names.length)
  return names[i]
}

// in memory "database"
const db = {}

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
    let mapped_url = req.body.url
    let name = randomShortName();
    db[name] = mapped_url
    let new_url =  '/' + name
    reply.view("/templates/created.ejs", { new_url, mapped_url });
  });

  fastify.get("/:short_url", (req, reply) => {
    let {short_url} = req.params
    let url = db[short_url]
    reply.redirect(302, url);
  })
}

fastify.register(routes)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
