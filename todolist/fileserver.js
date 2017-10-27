const server = http.createServer((req, res) => {
  const url = parse(req.url);
  const path = join(root, url.pathname);

  fs.stat(path,  (err, stat) => {
    if (err) {
      if ('ENOENT' == err.code) {
        res.statusCode = 404;
        res.end('Not Found');
      } else {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    } else {
      const stream = fs.createReadStream(path);

      res.setHeader('Content-Length', stat.size);
      
      stream.pipe(res);
      
      stream.on('error', function(err){
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
    }
  });
});
