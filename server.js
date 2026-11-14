/* Простой локальный сервер для игры «Хома-хулиган».
   Запуск:  node server.js  (или двойной клик по «ЗАПУСТИТЬ-ИГРУ.cmd»)
   Порт можно изменить:  set PORT=5000 && node server.js
*/
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8'
};

function getLanAddresses() {
  const result = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) result.push(net.address);
    }
  }
  return result;
}

const server = http.createServer((req, res) => {
  try {
    const rawUrl = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(ROOT, rawUrl === '/' ? 'index.html' : rawUrl);
    const relative = path.relative(ROOT, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('403');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      // SPA-style fallback for an installed PWA.
      filePath = path.join(ROOT, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ошибка сервера: ' + err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const lan = getLanAddresses();
  console.log('');
  console.log('  🐹  ХОМА-ХУЛИГАН запущен!');
  console.log('');
  console.log('  На этом компьютере:  http://localhost:' + PORT);
  lan.forEach((ip) => console.log('  На телефоне/планшете: http://' + ip + ':' + PORT));
  console.log('');
  console.log('  Устройства должны быть в одной Wi-Fi сети.');
  console.log('  Окно не закрывай, пока играешь. Остановить: Ctrl+C.');
  console.log('');
});
