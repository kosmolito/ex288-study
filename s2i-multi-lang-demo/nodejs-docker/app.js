// server.js
const http = require("http");

const port = 8080;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    return res.end("OK");
  }

  if (req.url === "/version") {
    res.writeHead(200);
    return res.end("v1");
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <h1>Hello from OpenShift</h1>
    <h2>This is a simple Node.js application</h2>
    <p>Path: ${req.url}</p>
  `);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});