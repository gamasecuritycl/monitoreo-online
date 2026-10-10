const https = require('https');

function check(url) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('--- URL:', url);
      const scripts = [...data.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
      console.log('Scripts count:', scripts.length);
      console.log('Sample scripts:', scripts.slice(0, 5));
      const buildIdMatch = data.match(/"buildId":"([^"]+)"/);
      console.log('Build ID:', buildIdMatch ? buildIdMatch[1] : 'not found');
      
      // Let's fetch one of the app scripts and check if Organigrama / Sims is inside
      const appScript = scripts.find(s => s.includes('/app/operacion') || s.includes('page-'));
      console.log('Operacion page script:', appScript);
      if (appScript) {
        const scriptUrl = appScript.startsWith('http') ? appScript : (new URL(url).origin + appScript);
        https.get(scriptUrl, (sRes) => {
          let sData = '';
          sRes.on('data', c => sData += c);
          sRes.on('end', () => {
            console.log('Script size:', sData.length);
            console.log('Includes Organigrama?', sData.includes('Organigrama') || sData.includes('organigrama'));
            console.log('Includes Oficina Autónoma?', sData.includes('Oficina') || sData.includes('Virtual'));
          });
        });
      }
    });
  });
}

check('https://controltestmonitoreo.vercel.app/operacion');
