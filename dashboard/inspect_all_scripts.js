const https = require('https');

async function main() {
  const url = 'https://controltestmonitoreo.vercel.app/operacion';
  const html = await new Promise((res) => {
    https.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    });
  });

  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Total scripts found:', scripts.length);

  for (const s of scripts) {
    const fullUrl = s.startsWith('http') ? s : 'https://controltestmonitoreo.vercel.app' + s;
    const content = await new Promise((res) => {
      https.get(fullUrl, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(d));
      });
    });
    const hasOrganigrama = content.includes('organigrama') || content.includes('Organigrama');
    const hasOficina = content.includes('Oficina Autónoma') || content.includes('Oficina Aut');
    const hasClaudio = content.includes('Claudio Valenzuela');
    if (hasOrganigrama || hasOficina || hasClaudio) {
      console.log(`FOUND IN ${s}: organigrama=${hasOrganigrama}, oficina=${hasOficina}, claudio=${hasClaudio}`);
    }
  }
  console.log('Search finished.');
}

main();
