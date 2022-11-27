import Fastify from 'fastify'
import ejs from 'ejs'
import view from "@fastify/view"

const fastify = Fastify({
  logger: true
})

fastify.register(view, {
  engine: {
    ejs
  },
});

async function routes (fastify, options) {
  fastify.get("/", (req, reply) => {
    reply.view("/templates/new.ejs", { text: "some test text" });
  });
}

fastify.register(routes)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})
