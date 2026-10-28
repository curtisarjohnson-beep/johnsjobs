import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
    if (!['index.html','styles.css','app.js','Retro Dotted Two-Tone J Emblem.png','JohnsJobs Team by the Service Van.png'].includes(name)) { res.writeHead(404); res.end('Not found'); return; }
    const data = await readFile(path.join(root,name));
    res.writeHead(200,{'Content-Type':types[path.extname(name)],'X-Content-Type-Options':'nosniff'}); res.end(data);
  } catch { res.writeHead(500); res.end('Unable to load page'); }
}).listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log('JohnsJobs running on port '+(process.env.PORT || 3000)));
