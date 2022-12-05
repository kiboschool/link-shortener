const http = require('node:http');
const ejs = require('ejs')
const statik = require('node-static')

const port = 3000

const fileserver = new statik.Server('/public');

const render = (res, body) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
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

let server = http.createServer((req, res) => {
  console.log(req.method, req.url)

  if (req.url.startsWith('/public')) {
    console.log('fileserver')
    return fileserver.serve(req, res);
  } else if (req.url == "/redirect") {
    return redirect(res, "/")
  } else if (req.url == "/") {
    return renderTemplate(res, "templates/new.ejs")
  }

  return render(res, '<h1>fallback!</h1>')
})

server.listen(port);
console.log("listening on http://localhost:" + port)
