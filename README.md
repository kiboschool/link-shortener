# Url shortener

remap urls to shorter ones / redirect 302 on access

Using the same html, css, and logic every time, so they should all be roughly the
same (and faster to build each one).

## Lots of different ways

- using different js and python frameworks
- store in a real database
- store in mongo
- hashing the url? needs to be a two-way function, so maybe some other
    compression

## JS Frameworks

### "raw" JS

- https://node.readthedocs.io/en/latest/api/http/
- [x] https://bun.sh/ /bun (with ejs and bun's sqlite)
- https://deno.land/

### "top tier" frameworks

- [x] https://www.fastify.io/: /fastify (with ejs + prisma)
- [x] https://expressjs.com/ /express (ejs with express-generator, prisma)
- https://remix.run/
- https://nextjs.org/
- https://nuxtjs.org/
- https://kit.svelte.dev/

### other frameworks I guess

- https://strapi.io/
- https://hapi.dev/
- https://adonisjs.com/
- https://nestjs.com/
- https://blitzjs.com/
- https://www.meteor.com/
- https://emberjs.com/
- https://redwoodjs.com/
- https://koajs.com/
- https://keystonejs.com/
- https://sailsjs.com/
- https://feathersjs.com/
- https://directus.io/
- https://amplication.com/

## Python Top Frameworks

- [x] https://flask.palletsprojects.com/en/2.2.x/ /flask (with sqlite)
- https://www.djangoproject.com/
- https://fastapi.tiangolo.com/
- https://docs.aiohttp.org/en/stable/

## More Python

- https://docs.cherrypy.dev/en/latest/
- http://www.hug.rest/
- https://falconframework.org/
- http://bottlepy.org/docs/dev/
- https://www.tornadoweb.org/en/stable/

