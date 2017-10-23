const http = require('http');
const qs = require('querystring');

const items = [];

const server = http.createServer((req, res) => {
  if ('/' == req.url) {
    switch (req.method) {
      case 'GET':
        show(res);
        break;
      case 'POST':
        add(req, res);
        break;
      default:
        badRequest(res);
    }
  } else {
    notFound(res);
  }
});

server.listen(3000);

function show(response) {
  const html = '<html><head><title>Todo List</title></head><body>'
    + '<h1>Todo List</h1>'
    + '<ul>'
    + items.map(function(item){
        return '<li>' + item + '</li>'
      }).join('')
    + '</ul>'
    + '<form method="post" action="/">'
    + '<p><input type="text" name="item" /></p>'
    + '<p><input type="submit" value="Add Item" /></p>'
    + '</form></body></html>';

  response.setHeader('Content-Type', 'text/html');
  response.setHeader('Content-Length', Buffer.byteLength(html));
  response.end(html);
}

function notFound(response) {
  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/plain');
  response.end('Not Found');
}

function badRequest(response) {
  response.statusCode = 400;
  response.setHeader('Content-Type', 'text/plain');
  response.end('Bad request');
}

function add(request, response) {
  let body = '';

  request.setEncoding('utf8');
  request.on('data', chunk => {
    body += chunk;
  });
  request.on('end', () => {
    const obj = qs.query(body);

    items.push(obj.item);
    
    show(response);
  });
}
