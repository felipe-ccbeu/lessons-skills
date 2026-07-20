// Quick-test prototype: proves live SSE voting works on the local network.
// No deps, no DB — everything in memory, resets on restart. Not part of the
// real presenter app; see PLANO_ENQUETES_AO_VIVO.md for the real design.
const http = require('http');
const os = require('os');

const PORT = 3900;

const options = ['A) I am', 'B) I is', 'C) I be'];
const tallies = [0, 0, 0];
const voters = new Set(); // voterKey values that already voted
const clients = new Set(); // open SSE response objects

function lanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

function broadcast() {
  const payload = `data: ${JSON.stringify({ tallies, total: tallies.reduce((a, b) => a + b, 0) })}\n\n`;
  for (const res of clients) res.write(payload);
}

const votePage = () => `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Votar</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f3f4f7; }
  h1 { font-size: 20px; }
  button { display: block; width: 100%; padding: 18px; margin: 10px 0; font-size: 17px;
    border-radius: 10px; border: 1px solid #d7dae0; background: #fff; cursor: pointer; }
  button:active { background: #eef2ff; border-color: #0448df; }
  #msg { margin-top: 16px; font-size: 15px; color: #0448df; font-weight: 600; }
</style></head>
<body>
  <h1>Qual a forma correta?</h1>
  ${options.map((o, i) => `<button onclick="vote(${i})">${o}</button>`).join('')}
  <div id="msg"></div>
  <script>
    let voterKey = localStorage.getItem('voterKey');
    if (!voterKey) {
      voterKey = crypto.randomUUID();
      localStorage.setItem('voterKey', voterKey);
    }
    async function vote(i) {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: i, voterKey }),
      });
      const msg = document.getElementById('msg');
      msg.textContent = res.status === 409 ? 'Você já votou!' : 'Voto registrado, olhe o telão!';
    }
  </script>
</body></html>`;

const resultsPage = () => `<!doctype html>
<html><head><meta charset="utf-8">
<title>Resultados ao vivo</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #fff; padding: 40px; }
  .bar-row { margin: 20px 0; }
  .label { font-size: 18px; margin-bottom: 6px; }
  .bar-track { background: #333; border-radius: 8px; overflow: hidden; height: 32px; }
  .bar-fill { background: linear-gradient(90deg, #0448df, #fd3682); height: 100%; width: 0%;
    transition: width 0.4s cubic-bezier(0.22,1,0.36,1); }
  .pct { font-size: 14px; color: #aaa; margin-top: 4px; }
</style></head>
<body>
  <h1>Resultados ao vivo</h1>
  <div id="bars"></div>
  <script>
    const options = ${JSON.stringify(options)};
    const bars = document.getElementById('bars');
    bars.innerHTML = options.map((o, i) => \`
      <div class="bar-row">
        <div class="label">\${o}</div>
        <div class="bar-track"><div class="bar-fill" id="fill-\${i}"></div></div>
        <div class="pct" id="pct-\${i}">0 votos</div>
      </div>\`).join('');

    const es = new EventSource('/api/stream');
    es.onmessage = (e) => {
      const { tallies, total } = JSON.parse(e.data);
      tallies.forEach((count, i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        document.getElementById('fill-' + i).style.width = pct + '%';
        document.getElementById('pct-' + i).textContent = count + ' votos (' + pct + '%)';
      });
    };
  </script>
</body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/vote' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(votePage());
    return;
  }

  if (url.pathname === '/results' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(resultsPage());
    return;
  }

  if (url.pathname === '/api/vote' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { option, voterKey } = JSON.parse(body);
        if (typeof option !== 'number' || !voterKey) {
          res.writeHead(400).end('bad request');
          return;
        }
        if (voters.has(voterKey)) {
          res.writeHead(409).end('already voted');
          return;
        }
        voters.add(voterKey);
        tallies[option]++;
        broadcast();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400).end('bad request');
      }
    });
    return;
  }

  if (url.pathname === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ tallies, total: tallies.reduce((a, b) => a + b, 0) })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  res.writeHead(404).end('not found');
});

server.listen(PORT, () => {
  const ip = lanIp();
  console.log(`\nTeste de enquete ao vivo rodando.\n`);
  console.log(`No celular (mesma rede Wi-Fi), acesse:`);
  console.log(`  http://${ip}:${PORT}/vote\n`);
  console.log(`No notebook (outra aba), acesse:`);
  console.log(`  http://localhost:${PORT}/results\n`);
});
